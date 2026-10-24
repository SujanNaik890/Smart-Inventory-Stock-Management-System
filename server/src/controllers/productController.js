import { query, get, run, transaction } from '../config/db.js';

export const getAllProducts = (req, res, next) => {
  try {
    const {
      search = '',
      category_id,
      status, // 'all', 'in_stock', 'low_stock', 'out_of_stock'
      sort_by = 'name',
      sort_order = 'ASC',
      page = 1,
      limit = 100
    } = req.query;

    let sql = `
      SELECT 
        p.*,
        c.name as category_name,
        c.color as category_color,
        s.name as supplier_name,
        CASE
          WHEN p.quantity = 0 THEN 'out_of_stock'
          WHEN p.quantity <= p.minimum_stock THEN 'low_stock'
          ELSE 'in_stock'
        END as stock_status
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.is_archived = 0
    `;

    const params = [];

    if (search && search.trim()) {
      sql += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (category_id && category_id !== 'all') {
      sql += ` AND p.category_id = ?`;
      params.push(Number(category_id));
    }

    if (status && status !== 'all') {
      if (status === 'out_of_stock') {
        sql += ` AND p.quantity = 0`;
      } else if (status === 'low_stock') {
        sql += ` AND p.quantity <= p.minimum_stock AND p.quantity > 0`;
      } else if (status === 'in_stock') {
        sql += ` AND p.quantity > p.minimum_stock`;
      }
    }

    // Allowed sort columns
    const allowedSort = ['name', 'sku', 'unit_price', 'quantity', 'minimum_stock', 'created_at', 'category_name'];
    const orderCol = allowedSort.includes(sort_by) ? sort_by : 'name';
    const direction = sort_order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    if (orderCol === 'category_name') {
      sql += ` ORDER BY c.name ${direction}`;
    } else {
      sql += ` ORDER BY p.${orderCol} ${direction}`;
    }

    const allRows = query(sql, params);
    const totalCount = allRows.length;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 100);
    const offset = (pageNum - 1) * limitNum;

    const paginatedProducts = allRows.slice(offset, offset + limitNum);

    res.json({
      success: true,
      total: totalCount,
      page: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
      products: paginatedProducts
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = (req, res, next) => {
  try {
    const { id } = req.params;

    const product = get(`
      SELECT 
        p.*,
        c.name as category_name,
        c.color as category_color,
        s.name as supplier_name,
        CASE
          WHEN p.quantity = 0 THEN 'out_of_stock'
          WHEN p.quantity <= p.minimum_stock THEN 'low_stock'
          ELSE 'in_stock'
        END as stock_status
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = ? AND p.is_archived = 0
    `, [id]);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Get recent transactions for this product
    const recentTransactions = query(`
      SELECT t.*, s.name as supplier_name
      FROM stock_transactions t
      LEFT JOIN suppliers s ON t.supplier_id = s.id
      WHERE t.product_id = ?
      ORDER BY t.created_at DESC
      LIMIT 10
    `, [id]);

    res.json({
      success: true,
      product: {
        ...product,
        transactions: recentTransactions
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = (req, res, next) => {
  try {
    const {
      name,
      sku,
      description = '',
      category_id,
      supplier_id,
      unit_price = 0,
      initial_quantity = 0,
      minimum_stock = 5,
      unit = 'units',
      image_url = ''
    } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Product name is required.' });
    }
    if (!sku || !sku.trim()) {
      return res.status(400).json({ success: false, message: 'SKU is required.' });
    }
    if (!category_id) {
      return res.status(400).json({ success: false, message: 'Category is required.' });
    }

    const priceNum = Number(unit_price);
    const qtyNum = parseInt(initial_quantity) || 0;
    const minNum = parseInt(minimum_stock) || 0;

    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ success: false, message: 'Unit price cannot be negative.' });
    }
    if (qtyNum < 0) {
      return res.status(400).json({ success: false, message: 'Initial quantity cannot be negative.' });
    }
    if (minNum < 0) {
      return res.status(400).json({ success: false, message: 'Minimum stock cannot be negative.' });
    }

    // Verify SKU uniqueness
    const existingSku = get('SELECT id FROM products WHERE LOWER(sku) = LOWER(?)', [sku.trim()]);
    if (existingSku) {
      return res.status(400).json({ success: false, message: `SKU "${sku.trim()}" is already in use.` });
    }

    // Verify category exists
    const category = get('SELECT id FROM categories WHERE id = ?', [category_id]);
    if (!category) {
      return res.status(400).json({ success: false, message: 'Selected category does not exist.' });
    }

    // Run atomically with transaction
    const newProduct = transaction((tDb) => {
      const result = tDb.run(`
        INSERT INTO products 
        (name, sku, description, category_id, supplier_id, unit_price, quantity, minimum_stock, unit, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        name.trim(),
        sku.trim().toUpperCase(),
        description ? description.trim() : '',
        category_id,
        supplier_id || null,
        priceNum,
        qtyNum,
        minNum,
        unit || 'units',
        image_url || null
      ]);

      const productId = result.lastInsertRowid;

      // If initial quantity > 0, log initial stock IN transaction
      if (qtyNum > 0) {
        tDb.run(`
          INSERT INTO stock_transactions
          (product_id, type, quantity, previous_quantity, new_quantity, supplier_id, reference_number, reason, notes, created_by)
          VALUES (?, 'IN', ?, 0, ?, ?, ?, 'Initial Stock Intake', 'Registered during product creation', ?)
        `, [
          productId,
          qtyNum,
          qtyNum,
          supplier_id || null,
          `INIT-${Date.now().toString().slice(-6)}`,
          req.admin ? req.admin.name : 'Admin'
        ]);
      }

      return tDb.get(`
        SELECT p.*, c.name as category_name, c.color as category_color, s.name as supplier_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.id = ?
      `, [productId]);
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: newProduct
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      sku,
      description,
      category_id,
      supplier_id,
      unit_price,
      minimum_stock,
      unit,
      image_url
    } = req.body;

    const existing = get('SELECT * FROM products WHERE id = ? AND is_archived = 0', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    if (name && !name.trim()) {
      return res.status(400).json({ success: false, message: 'Product name cannot be empty.' });
    }

    if (sku && sku.trim()) {
      const duplicateSku = get('SELECT id FROM products WHERE LOWER(sku) = LOWER(?) AND id != ?', [sku.trim(), id]);
      if (duplicateSku) {
        return res.status(400).json({ success: false, message: `SKU "${sku.trim()}" is already assigned to another product.` });
      }
    }

    if (category_id) {
      const catExists = get('SELECT id FROM categories WHERE id = ?', [category_id]);
      if (!catExists) {
        return res.status(400).json({ success: false, message: 'Selected category does not exist.' });
      }
    }

    const priceNum = unit_price !== undefined ? Number(unit_price) : existing.unit_price;
    const minNum = minimum_stock !== undefined ? parseInt(minimum_stock) : existing.minimum_stock;

    if (priceNum < 0) {
      return res.status(400).json({ success: false, message: 'Unit price cannot be negative.' });
    }
    if (minNum < 0) {
      return res.status(400).json({ success: false, message: 'Minimum stock threshold cannot be negative.' });
    }

    run(`
      UPDATE products
      SET name = COALESCE(?, name),
          sku = COALESCE(?, sku),
          description = COALESCE(?, description),
          category_id = COALESCE(?, category_id),
          supplier_id = ?,
          unit_price = ?,
          minimum_stock = ?,
          unit = COALESCE(?, unit),
          image_url = COALESCE(?, image_url),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name ? name.trim() : null,
      sku ? sku.trim().toUpperCase() : null,
      description !== undefined ? description : null,
      category_id || null,
      supplier_id !== undefined ? (supplier_id || null) : existing.supplier_id,
      priceNum,
      minNum,
      unit || null,
      image_url !== undefined ? image_url : existing.image_url,
      id
    ]);

    const updated = get(`
      SELECT p.*, c.name as category_name, c.color as category_color, s.name as supplier_name,
        CASE
          WHEN p.quantity = 0 THEN 'out_of_stock'
          WHEN p.quantity <= p.minimum_stock THEN 'low_stock'
          ELSE 'in_stock'
        END as stock_status
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = ?
    `, [id]);

    res.json({
      success: true,
      message: 'Product updated successfully',
      product: updated
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = get('SELECT * FROM products WHERE id = ? AND is_archived = 0', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Check if product has historical transactions
    const txCount = get('SELECT COUNT(*) as count FROM stock_transactions WHERE product_id = ?', [id]);
    if (txCount && txCount.count > 0) {
      // Safe archival strategy per requirement: preserve inventory records and audit trail!
      run('UPDATE products SET is_archived = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
      return res.json({
        success: true,
        message: `Product "${existing.name}" has ${txCount.count} historical stock transactions and has been safely archived to preserve inventory audit records.`
      });
    }

    // If zero transactions, delete completely
    run('DELETE FROM products WHERE id = ?', [id]);

    res.json({
      success: true,
      message: `Product "${existing.name}" was permanently deleted.`
    });
  } catch (error) {
    next(error);
  }
};
