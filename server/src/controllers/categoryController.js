import { query, get, run } from '../config/db.js';

export const getAllCategories = (req, res, next) => {
  try {
    const categories = query(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.is_archived = 0
      GROUP BY c.id
      ORDER BY c.name ASC
    `);

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = (req, res, next) => {
  try {
    const { name, description, icon, color } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const existing = get('SELECT id FROM categories WHERE LOWER(name) = LOWER(?)', [name.trim()]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'A category with this name already exists.' });
    }

    const result = run(
      'INSERT INTO categories (name, description, icon, color) VALUES (?, ?, ?, ?)',
      [name.trim(), description || '', icon || 'Folder', color || '#405BFF']
    );

    const newCategory = get('SELECT * FROM categories WHERE id = ?', [result.lastInsertRowid]);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category: { ...newCategory, product_count: 0 }
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, icon, color } = req.body;

    const existing = get('SELECT * FROM categories WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    if (name && name.trim()) {
      const duplicate = get('SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND id != ?', [name.trim(), id]);
      if (duplicate) {
        return res.status(400).json({ success: false, message: 'Another category with this name already exists.' });
      }
    }

    run(`
      UPDATE categories
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          icon = COALESCE(?, icon),
          color = COALESCE(?, color)
      WHERE id = ?
    `, [name ? name.trim() : null, description, icon, color, id]);

    const updated = get(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.is_archived = 0
      WHERE c.id = ?
      GROUP BY c.id
    `, [id]);

    res.json({
      success: true,
      message: 'Category updated successfully',
      category: updated
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = get('SELECT * FROM categories WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    // Check if category has active products
    const linkedProducts = get('SELECT COUNT(*) as count FROM products WHERE category_id = ? AND is_archived = 0', [id]);
    if (linkedProducts && linkedProducts.count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category "${existing.name}". It is associated with ${linkedProducts.count} active product(s). Please reassign or delete these products first.`
      });
    }

    run('DELETE FROM categories WHERE id = ?', [id]);

    res.json({
      success: true,
      message: `Category "${existing.name}" deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
};
