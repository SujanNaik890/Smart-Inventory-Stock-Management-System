import { query, get, run, transaction } from '../config/db.js';

export const stockIn = (req, res, next) => {
  try {
    const {
      product_id,
      quantity,
      supplier_id,
      reference_number,
      unit_cost,
      notes
    } = req.body;

    if (!product_id) {
      return res.status(400).json({ success: false, message: 'Please select a valid product.' });
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Purchased quantity must be a positive integer greater than zero.' });
    }

    const result = transaction((tDb) => {
      const product = tDb.get('SELECT * FROM products WHERE id = ? AND is_archived = 0', [product_id]);
      if (!product) {
        throw new Error('Product not found or has been archived.');
      }

      if (supplier_id) {
        const supplier = tDb.get('SELECT id FROM suppliers WHERE id = ?', [supplier_id]);
        if (!supplier) {
          throw new Error('Selected supplier does not exist.');
        }
      }

      const prevQty = product.quantity;
      const newQty = prevQty + qty;

      // Update product quantity
      tDb.run(`
        UPDATE products
        SET quantity = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [newQty, product_id]);

      // Record transaction
      const txResult = tDb.run(`
        INSERT INTO stock_transactions
        (product_id, type, quantity, previous_quantity, new_quantity, supplier_id, reference_number, reason, notes, created_by)
        VALUES (?, 'IN', ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        product_id,
        qty,
        prevQty,
        newQty,
        supplier_id || product.supplier_id || null,
        reference_number ? reference_number.trim() : `PO-${Date.now().toString().slice(-6)}`,
        'Stock Purchase / Restock',
        notes ? notes.trim() : (unit_cost ? `Purchased at unit cost: $${unit_cost}` : ''),
        req.admin ? req.admin.name : 'Admin'
      ]);

      const updatedProduct = tDb.get(`
        SELECT p.*, c.name as category_name, s.name as supplier_name,
          CASE
            WHEN p.quantity = 0 THEN 'out_of_stock'
            WHEN p.quantity <= p.minimum_stock THEN 'low_stock'
            ELSE 'in_stock'
          END as stock_status
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.id = ?
      `, [product_id]);

      const newTx = tDb.get(`
        SELECT t.*, p.name as product_name, p.sku as product_sku, s.name as supplier_name
        FROM stock_transactions t
        JOIN products p ON t.product_id = p.id
        LEFT JOIN suppliers s ON t.supplier_id = s.id
        WHERE t.id = ?
      `, [txResult.lastInsertRowid]);

      return { updatedProduct, transaction: newTx };
    });

    res.status(200).json({
      success: true,
      message: `Stock intake recorded successfully! Quantity updated from ${result.transaction.previous_quantity} to ${result.transaction.new_quantity}.`,
      product: result.updatedProduct,
      transaction: result.transaction
    });
  } catch (error) {
    if (error.message.includes('Product not found') || error.message.includes('supplier does not exist')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const stockOut = (req, res, next) => {
  try {
    const {
      product_id,
      quantity,
      recipient_destination,
      reference_number,
      reason,
      notes
    } = req.body;

    if (!product_id) {
      return res.status(400).json({ success: false, message: 'Please select a valid product.' });
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Issued quantity must be a positive integer greater than zero.' });
    }

    const result = transaction((tDb) => {
      const product = tDb.get('SELECT * FROM products WHERE id = ? AND is_archived = 0', [product_id]);
      if (!product) {
        throw new Error('Product not found or has been archived.');
      }

      const prevQty = product.quantity;

      // CRITICAL CHECK: Prevent negative inventory
      if (prevQty < qty) {
        const error = new Error(`Insufficient stock available. Current stock is ${prevQty} ${product.unit || 'units'}, but ${qty} was requested. Negative inventory is strictly prohibited.`);
        error.statusCode = 400;
        throw error;
      }

      const newQty = prevQty - qty;

      // Update product quantity
      tDb.run(`
        UPDATE products
        SET quantity = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [newQty, product_id]);

      // Record transaction
      const txResult = tDb.run(`
        INSERT INTO stock_transactions
        (product_id, type, quantity, previous_quantity, new_quantity, recipient_destination, reference_number, reason, notes, created_by)
        VALUES (?, 'OUT', ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        product_id,
        qty,
        prevQty,
        newQty,
        recipient_destination ? recipient_destination.trim() : 'General Issue',
        reference_number ? reference_number.trim() : `ISSUE-${Date.now().toString().slice(-6)}`,
        reason ? reason.trim() : 'Stock Issue / Allocation',
        notes ? notes.trim() : '',
        req.admin ? req.admin.name : 'Admin'
      ]);

      const updatedProduct = tDb.get(`
        SELECT p.*, c.name as category_name, s.name as supplier_name,
          CASE
            WHEN p.quantity = 0 THEN 'out_of_stock'
            WHEN p.quantity <= p.minimum_stock THEN 'low_stock'
            ELSE 'in_stock'
          END as stock_status
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.id = ?
      `, [product_id]);

      const newTx = tDb.get(`
        SELECT t.*, p.name as product_name, p.sku as product_sku
        FROM stock_transactions t
        JOIN products p ON t.product_id = p.id
        WHERE t.id = ?
      `, [txResult.lastInsertRowid]);

      return { updatedProduct, transaction: newTx };
    });

    res.status(200).json({
      success: true,
      message: `Stock issued successfully! Quantity reduced from ${result.transaction.previous_quantity} to ${result.transaction.new_quantity}.`,
      product: result.updatedProduct,
      transaction: result.transaction
    });
  } catch (error) {
    if (error.statusCode === 400 || error.message.includes('Insufficient stock')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const getTransactions = (req, res, next) => {
  try {
    const {
      type, // 'all', 'IN', 'OUT'
      product_id,
      start_date,
      end_date,
      search,
      page = 1,
      limit = 50
    } = req.query;

    let sql = `
      SELECT 
        t.*,
        p.name as product_name,
        p.sku as product_sku,
        p.image_url as product_image,
        c.name as category_name,
        s.name as supplier_name
      FROM stock_transactions t
      JOIN products p ON t.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON t.supplier_id = s.id
      WHERE 1=1
    `;

    const params = [];

    if (type && type !== 'all') {
      sql += ` AND t.type = ?`;
      params.push(type.toUpperCase());
    }

    if (product_id && product_id !== 'all') {
      sql += ` AND t.product_id = ?`;
      params.push(Number(product_id));
    }

    if (start_date) {
      sql += ` AND date(t.created_at) >= date(?)`;
      params.push(start_date);
    }

    if (end_date) {
      sql += ` AND date(t.created_at) <= date(?)`;
      params.push(end_date);
    }

    if (search && search.trim()) {
      sql += ` AND (p.name LIKE ? OR p.sku LIKE ? OR t.reference_number LIKE ? OR t.recipient_destination LIKE ? OR t.reason LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    sql += ` ORDER BY t.created_at DESC`;

    const allRows = query(sql, params);
    const totalCount = allRows.length;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 50);
    const offset = (pageNum - 1) * limitNum;

    const paginatedTransactions = allRows.slice(offset, offset + limitNum);

    res.json({
      success: true,
      total: totalCount,
      page: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
      transactions: paginatedTransactions
    });
  } catch (error) {
    next(error);
  }
};
