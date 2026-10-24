import { query, get, run } from '../config/db.js';

export const getAllSuppliers = (req, res, next) => {
  try {
    const suppliers = query(`
      SELECT s.*, COUNT(DISTINCT p.id) as product_count
      FROM suppliers s
      LEFT JOIN products p ON p.supplier_id = s.id AND p.is_archived = 0
      GROUP BY s.id
      ORDER BY s.name ASC
    `);

    res.json({
      success: true,
      suppliers
    });
  } catch (error) {
    next(error);
  }
};

export const createSupplier = (req, res, next) => {
  try {
    const { name, contact_person, email, phone, address } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Supplier name is required.' });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    const result = run(
      'INSERT INTO suppliers (name, contact_person, email, phone, address) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), contact_person || '', email ? email.trim() : '', phone || '', address || '']
    );

    const newSupplier = get('SELECT * FROM suppliers WHERE id = ?', [result.lastInsertRowid]);

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      supplier: { ...newSupplier, product_count: 0 }
    });
  } catch (error) {
    next(error);
  }
};

export const updateSupplier = (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, contact_person, email, phone, address } = req.body;

    const existing = get('SELECT * FROM suppliers WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Supplier not found.' });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    run(`
      UPDATE suppliers
      SET name = COALESCE(?, name),
          contact_person = COALESCE(?, contact_person),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone),
          address = COALESCE(?, address)
      WHERE id = ?
    `, [name ? name.trim() : null, contact_person, email ? email.trim() : null, phone, address, id]);

    const updated = get(`
      SELECT s.*, COUNT(DISTINCT p.id) as product_count
      FROM suppliers s
      LEFT JOIN products p ON p.supplier_id = s.id AND p.is_archived = 0
      WHERE s.id = ?
      GROUP BY s.id
    `, [id]);

    res.json({
      success: true,
      message: 'Supplier updated successfully',
      supplier: updated
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSupplier = (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = get('SELECT * FROM suppliers WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Supplier not found.' });
    }

    // Check if supplier is linked to transactions
    const txCount = get('SELECT COUNT(*) as count FROM stock_transactions WHERE supplier_id = ?', [id]);
    if (txCount && txCount.count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete supplier "${existing.name}" because it is referenced in ${txCount.count} historical stock purchase records. You can modify its details instead.`
      });
    }

    // Unlink any products first
    run('UPDATE products SET supplier_id = NULL WHERE supplier_id = ?', [id]);
    run('DELETE FROM suppliers WHERE id = ?', [id]);

    res.json({
      success: true,
      message: `Supplier "${existing.name}" deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
};
