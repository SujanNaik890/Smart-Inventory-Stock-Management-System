import { query, get } from '../config/db.js';

export const getInventorySummaryReport = (req, res, next) => {
  try {
    const summary = get(`
      SELECT 
        COUNT(*) as total_products,
        COALESCE(SUM(quantity), 0) as total_units,
        COALESCE(SUM(quantity * unit_price), 0) as total_valuation,
        COALESCE(AVG(unit_price), 0) as average_unit_price
      FROM products
      WHERE is_archived = 0
    `);

    const lowStockCount = get(`
      SELECT COUNT(*) as count 
      FROM products 
      WHERE is_archived = 0 AND quantity <= minimum_stock AND quantity > 0
    `);

    const outOfStockCount = get(`
      SELECT COUNT(*) as count 
      FROM products 
      WHERE is_archived = 0 AND quantity = 0
    `);

    res.json({
      success: true,
      summary: {
        totalProducts: summary.total_products || 0,
        totalUnits: summary.total_units || 0,
        totalValuation: parseFloat((summary.total_valuation || 0).toFixed(2)),
        averageUnitPrice: parseFloat((summary.average_unit_price || 0).toFixed(2)),
        lowStockProducts: lowStockCount.count || 0,
        outOfStockProducts: outOfStockCount.count || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getLowStockReport = (req, res, next) => {
  try {
    const items = query(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        c.name as category_name,
        p.quantity as current_quantity,
        p.minimum_stock,
        p.unit_price,
        p.unit,
        s.name as supplier_name,
        CASE
          WHEN p.quantity = 0 THEN (p.minimum_stock * 2)
          ELSE ((p.minimum_stock * 2) - p.quantity)
        END as suggested_replenishment,
        CASE
          WHEN p.quantity = 0 THEN 'OUT_OF_STOCK'
          ELSE 'CRITICAL_LOW'
        END as urgency
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.is_archived = 0 AND p.quantity <= p.minimum_stock
      ORDER BY p.quantity ASC, (p.minimum_stock - p.quantity) DESC
    `);

    res.json({
      success: true,
      count: items.length,
      items
    });
  } catch (error) {
    next(error);
  }
};

export const getStockMovementReport = (req, res, next) => {
  try {
    const { start_date, end_date, product_id, category_id } = req.query;

    let filterSql = '';
    const params = [];

    if (start_date) {
      filterSql += ' AND date(t.created_at) >= date(?)';
      params.push(start_date);
    }
    if (end_date) {
      filterSql += ' AND date(t.created_at) <= date(?)';
      params.push(end_date);
    }
    if (product_id && product_id !== 'all') {
      filterSql += ' AND t.product_id = ?';
      params.push(Number(product_id));
    }
    if (category_id && category_id !== 'all') {
      filterSql += ' AND p.category_id = ?';
      params.push(Number(category_id));
    }

    const inTotal = get(`
      SELECT COALESCE(SUM(t.quantity), 0) as total, COUNT(*) as count
      FROM stock_transactions t
      JOIN products p ON t.product_id = p.id
      WHERE t.type = 'IN' ${filterSql}
    `, params);

    const outTotal = get(`
      SELECT COALESCE(SUM(t.quantity), 0) as total, COUNT(*) as count
      FROM stock_transactions t
      JOIN products p ON t.product_id = p.id
      WHERE t.type = 'OUT' ${filterSql}
    `, params);

    const netMovement = (inTotal.total || 0) - (outTotal.total || 0);

    res.json({
      success: true,
      movement: {
        stockInUnits: inTotal.total || 0,
        stockInCount: inTotal.count || 0,
        stockOutUnits: outTotal.total || 0,
        stockOutCount: outTotal.count || 0,
        netMovement,
        totalTransactions: (inTotal.count || 0) + (outTotal.count || 0)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryReport = (req, res, next) => {
  try {
    const categories = query(`
      SELECT 
        c.id,
        c.name as category_name,
        c.color,
        COUNT(p.id) as product_count,
        COALESCE(SUM(p.quantity), 0) as total_units,
        COALESCE(SUM(p.quantity * p.unit_price), 0) as total_valuation,
        COALESCE(SUM(CASE WHEN p.quantity <= p.minimum_stock THEN 1 ELSE 0 END), 0) as low_stock_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.is_archived = 0
      GROUP BY c.id
      ORDER BY total_valuation DESC
    `);

    res.json({
      success: true,
      categories: categories.map(cat => ({
        ...cat,
        total_valuation: parseFloat((cat.total_valuation || 0).toFixed(2))
      }))
    });
  } catch (error) {
    next(error);
  }
};
