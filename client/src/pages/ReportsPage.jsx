import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Filter,
  TrendingUp,
  AlertTriangle,
  Boxes,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  PieChart
} from 'lucide-react';
import { reportService, categoryService, productService } from '../services/api';
import NotificationToast from '../components/NotificationToast';

export const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'lowstock', 'movement', 'categories', 'transactions'

  // Data states
  const [summary, setSummary] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [movement, setMovement] = useState(null);
  const [categoryReport, setCategoryReport] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [txType, setTxType] = useState('all');

  const [productsList, setProductsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [toast, setToast] = useState(null);

  const reportContainerRef = useRef(null);

  const loadFilterOptions = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        productService.getAll({ limit: 200 }),
        categoryService.getAll()
      ]);
      if (prodRes.success) setProductsList(prodRes.products || []);
      if (catRes.success) setCategoriesList(catRes.categories || []);
    } catch (e) {
      console.error('Filter options error', e);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [sumRes, lowRes, movRes, catRes, txRes] = await Promise.all([
        reportService.getInventory(),
        reportService.getLowStock(),
        reportService.getStockMovement({
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          product_id: selectedProduct !== 'all' ? selectedProduct : undefined,
          category_id: selectedCategory !== 'all' ? selectedCategory : undefined
        }),
        reportService.getCategories(),
        reportService.getTransactions({
          type: txType !== 'all' ? txType : undefined,
          product_id: selectedProduct !== 'all' ? selectedProduct : undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          limit: 100
        })
      ]);

      if (sumRes.success) setSummary(sumRes.summary);
      if (lowRes.success) setLowStockItems(lowRes.items || []);
      if (movRes.success) setMovement(movRes.movement);
      if (catRes.success) setCategoryReport(catRes.categories || []);
      if (txRes.success) setTransactions(txRes.transactions || []);
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate, selectedProduct, selectedCategory, txType]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let headers = [];
    let rows = [];
    let filename = `StockSmart_Report_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`;

    if (activeTab === 'lowstock') {
      headers = ['Product', 'SKU', 'Category', 'Current Qty', 'Min Stock', 'Suggested Restock', 'Unit Price ($)', 'Supplier'];
      rows = lowStockItems.map(i => [
        `"${i.name.replace(/"/g, '""')}"`,
        i.sku,
        `"${i.category_name}"`,
        i.current_quantity,
        i.minimum_stock,
        i.suggested_replenishment,
        i.unit_price.toFixed(2),
        `"${i.supplier_name || 'N/A'}"`
      ]);
    } else if (activeTab === 'categories') {
      headers = ['Category', 'Product Count', 'Total Units', 'Total Valuation ($)', 'Low Stock SKUs'];
      rows = categoryReport.map(c => [
        `"${c.category_name.replace(/"/g, '""')}"`,
        c.product_count,
        c.total_units,
        c.total_valuation.toFixed(2),
        c.low_stock_count
      ]);
    } else {
      // Default transactions
      headers = ['Tx ID', 'Product', 'SKU', 'Type', 'Quantity', 'Previous Qty', 'New Qty', 'Destination / Vendor', 'Reference', 'Date'];
      rows = transactions.map(t => [
        t.id,
        `"${t.product_name.replace(/"/g, '""')}"`,
        t.product_sku,
        t.type,
        t.quantity,
        t.previous_quantity,
        t.new_quantity,
        `"${(t.recipient_destination || t.supplier_name || 'N/A').replace(/"/g, '""')}"`,
        `"${t.reference_number || ''}"`,
        t.created_at
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }} ref={reportContainerRef}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#101A46', letterSpacing: '-0.4px' }}>
            Inventory Analytics &amp; Reports
          </h2>
          <p style={{ fontSize: '14px', color: '#727D9E', marginTop: '4px' }}>
            Audit inventory health, capital valuation, low-stock alerts, and material movements.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={handlePrint} className="btn-secondary">
            <Printer size={16} />
            <span>Print Report</span>
          </button>
          <button onClick={handleExportCSV} className="btn-primary">
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Global Filter Bar */}
      <div
        className="stock-card"
        style={{
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#576282' }}>
          <Calendar size={16} color="#727D9E" />
          <span>From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{
              height: '38px',
              padding: '0 10px',
              borderRadius: '8px',
              border: '1px solid #E7ECF7',
              background: '#F6F8FF',
              fontSize: '13px'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#576282' }}>
          <span>To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{
              height: '38px',
              padding: '0 10px',
              borderRadius: '8px',
              border: '1px solid #E7ECF7',
              background: '#F6F8FF',
              fontSize: '13px'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            style={{
              height: '38px',
              padding: '0 12px',
              borderRadius: '8px',
              border: '1px solid #E7ECF7',
              background: '#F6F8FF',
              fontSize: '13px',
              color: '#576282'
            }}
          >
            <option value="all">All Products</option>
            {productsList.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              height: '38px',
              padding: '0 12px',
              borderRadius: '8px',
              border: '1px solid #E7ECF7',
              background: '#F6F8FF',
              fontSize: '13px',
              color: '#576282'
            }}
          >
            <option value="all">All Categories</option>
            {categoriesList.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={txType}
            onChange={(e) => setTxType(e.target.value)}
            style={{
              height: '38px',
              padding: '0 12px',
              borderRadius: '8px',
              border: '1px solid #E7ECF7',
              background: '#F6F8FF',
              fontSize: '13px',
              color: '#576282'
            }}
          >
            <option value="all">All Movement Types</option>
            <option value="IN">Purchases (IN)</option>
            <option value="OUT">Issues (OUT)</option>
          </select>
        </div>

        {(startDate || endDate || selectedProduct !== 'all' || selectedCategory !== 'all' || txType !== 'all') && (
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setSelectedProduct('all');
              setSelectedCategory('all');
              setTxType('all');
            }}
            style={{ fontSize: '12px', color: '#405BFF', fontWeight: '600' }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Report Section Tabs */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {[
          { id: 'summary', label: 'A. Inventory Summary' },
          { id: 'lowstock', label: 'B. Low-Stock Report' },
          { id: 'movement', label: 'C. Stock Movement' },
          { id: 'categories', label: 'D. Category Valuation' },
          { id: 'transactions', label: 'E. Transaction Ledger' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '700',
              background: activeTab === tab.id ? '#405BFF' : '#FFFFFF',
              color: activeTab === tab.id ? '#FFFFFF' : '#576282',
              border: `1px solid ${activeTab === tab.id ? '#405BFF' : '#E7ECF7'}`,
              transition: 'all 0.15s ease',
              boxShadow: activeTab === tab.id ? '0 4px 14px rgba(64, 91, 255, 0.25)' : 'none'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SECTION A: INVENTORY SUMMARY */}
      {activeTab === 'summary' && summary && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
            <div className="stock-card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#405BFF', marginBottom: '8px' }}>
                <Boxes size={22} />
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#727D9E' }}>Total SKUs</span>
              </div>
              <h3 style={{ fontSize: '28px', fontWeight: '800', color: '#101A46' }}>
                {summary.totalProducts}
              </h3>
              <p style={{ fontSize: '12px', color: '#727D9E', marginTop: '4px' }}>Active registered catalog items</p>
            </div>

            <div className="stock-card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#16B979', marginBottom: '8px' }}>
                <Boxes size={22} />
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#727D9E' }}>Physical Stock Units</span>
              </div>
              <h3 style={{ fontSize: '28px', fontWeight: '800', color: '#101A46' }}>
                {summary.totalUnits.toLocaleString()}
              </h3>
              <p style={{ fontSize: '12px', color: '#727D9E', marginTop: '4px' }}>Aggregate inventory count</p>
            </div>

            <div className="stock-card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#8267F5', marginBottom: '8px' }}>
                <DollarSign size={22} />
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#727D9E' }}>Total Asset Valuation</span>
              </div>
              <h3 style={{ fontSize: '28px', fontWeight: '800', color: '#101A46' }}>
                ${summary.totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h3>
              <p style={{ fontSize: '12px', color: '#727D9E', marginTop: '4px' }}>Avg unit cost: ${summary.averageUnitPrice}</p>
            </div>

            <div className="stock-card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#FF9B38', marginBottom: '8px' }}>
                <AlertTriangle size={22} />
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#727D9E' }}>Low Stock Items</span>
              </div>
              <h3 style={{ fontSize: '28px', fontWeight: '800', color: '#FF9B38' }}>
                {summary.lowStockProducts}
              </h3>
              <p style={{ fontSize: '12px', color: '#727D9E', marginTop: '4px' }}>At or below min threshold</p>
            </div>

            <div className="stock-card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#FF525C', marginBottom: '8px' }}>
                <AlertTriangle size={22} />
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#727D9E' }}>Out of Stock</span>
              </div>
              <h3 style={{ fontSize: '28px', fontWeight: '800', color: '#FF525C' }}>
                {summary.outOfStockProducts}
              </h3>
              <p style={{ fontSize: '12px', color: '#727D9E', marginTop: '4px' }}>Zero inventory available</p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION B: LOW STOCK REPORT */}
      {activeTab === 'lowstock' && (
        <div className="stock-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #E7ECF7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#101A46' }}>
              Critical Stock Replenishment Schedule
            </h3>
            <span style={{ fontSize: '12px', background: '#FFF1F0', color: '#FF525C', padding: '4px 10px', borderRadius: '8px', fontWeight: '700' }}>
              {lowStockItems.length} Products Need Restocking
            </span>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '24px' }}>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Min Required</th>
                  <th>Suggested Restock</th>
                  <th>Unit Price</th>
                  <th>Est. Cost</th>
                  <th style={{ paddingRight: '24px' }}>Urgency</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: '#727D9E' }}>
                      All inventory items are currently above their safety thresholds.
                    </td>
                  </tr>
                ) : (
                  lowStockItems.map((item) => (
                    <tr key={item.id}>
                      <td style={{ paddingLeft: '24px', fontWeight: '700', color: '#101A46' }}>
                        {item.name}
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '12px', background: '#F1F4FA', padding: '2px 8px', borderRadius: '6px' }}>
                          {item.sku}
                        </span>
                      </td>
                      <td>{item.category_name}</td>
                      <td style={{ fontWeight: '800', color: item.current_quantity === 0 ? '#DC2626' : '#FF525C' }}>
                        {item.current_quantity} {item.unit}
                      </td>
                      <td style={{ color: '#727D9E' }}>
                        {item.minimum_stock} {item.unit}
                      </td>
                      <td>
                        <strong style={{ color: '#16B979' }}>+{item.suggested_replenishment} {item.unit}</strong>
                      </td>
                      <td>${item.unit_price.toFixed(2)}</td>
                      <td style={{ fontWeight: '700', color: '#101A46' }}>
                        ${(item.suggested_replenishment * item.unit_price).toFixed(2)}
                      </td>
                      <td style={{ paddingRight: '24px' }}>
                        {item.current_quantity === 0 ? (
                          <span className="badge-out-of-stock">Depleted</span>
                        ) : (
                          <span className="badge-low-stock">Critical Buffer</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION C: STOCK MOVEMENT REPORT */}
      {activeTab === 'movement' && movement && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div className="stock-card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16B979', marginBottom: '8px' }}>
                <ArrowDownLeft size={22} strokeWidth={2.4} />
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#727D9E' }}>Total Intake (Stock In)</span>
              </div>
              <h3 style={{ fontSize: '28px', fontWeight: '800', color: '#16B979' }}>
                +{movement.stockInUnits.toLocaleString()} units
              </h3>
              <p style={{ fontSize: '12px', color: '#727D9E', marginTop: '4px' }}>Recorded across {movement.stockInCount} purchase batches</p>
            </div>

            <div className="stock-card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FF525C', marginBottom: '8px' }}>
                <ArrowUpRight size={22} strokeWidth={2.4} />
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#727D9E' }}>Total Issued (Stock Out)</span>
              </div>
              <h3 style={{ fontSize: '28px', fontWeight: '800', color: '#FF525C' }}>
                -{movement.stockOutUnits.toLocaleString()} units
              </h3>
              <p style={{ fontSize: '12px', color: '#727D9E', marginTop: '4px' }}>Recorded across {movement.stockOutCount} issue slips</p>
            </div>

            <div className="stock-card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#405BFF', marginBottom: '8px' }}>
                <TrendingUp size={22} strokeWidth={2.4} />
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#727D9E' }}>Net Inventory Shift</span>
              </div>
              <h3 style={{ fontSize: '28px', fontWeight: '800', color: movement.netMovement >= 0 ? '#101A46' : '#FF525C' }}>
                {movement.netMovement >= 0 ? `+${movement.netMovement}` : movement.netMovement} units
              </h3>
              <p style={{ fontSize: '12px', color: '#727D9E', marginTop: '4px' }}>Net inventory velocity</p>
            </div>

            <div className="stock-card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8267F5', marginBottom: '8px' }}>
                <FileText size={22} strokeWidth={2.4} />
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#727D9E' }}>Audit Activity Count</span>
              </div>
              <h3 style={{ fontSize: '28px', fontWeight: '800', color: '#101A46' }}>
                {movement.totalTransactions} events
              </h3>
              <p style={{ fontSize: '12px', color: '#727D9E', marginTop: '4px' }}>Compliant atomic records</p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION D: CATEGORY REPORT */}
      {activeTab === 'categories' && (
        <div className="stock-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #E7ECF7' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#101A46' }}>
              Category Capital Allocation &amp; Volume
            </h3>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '24px' }}>Category Name</th>
                  <th>Product SKUs</th>
                  <th>Total Physical Units</th>
                  <th>Category Asset Value</th>
                  <th>Low Stock Warnings</th>
                  <th style={{ paddingRight: '24px' }}>Portfolio Share</th>
                </tr>
              </thead>
              <tbody>
                {categoryReport.map((c) => {
                  const totalVal = categoryReport.reduce((acc, cat) => acc + cat.total_valuation, 0);
                  const share = totalVal > 0 ? ((c.total_valuation / totalVal) * 100).toFixed(1) : 0;
                  return (
                    <tr key={c.id}>
                      <td style={{ paddingLeft: '24px' }}>
                        <span style={{ fontWeight: '700', color: '#101A46', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: c.color || '#405BFF' }} />
                          {c.category_name}
                        </span>
                      </td>
                      <td style={{ fontWeight: '600' }}>{c.product_count} items</td>
                      <td>{c.total_units.toLocaleString()} units</td>
                      <td style={{ fontWeight: '800', color: '#101A46' }}>
                        ${c.total_valuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        {c.low_stock_count > 0 ? (
                          <span style={{ color: '#FF525C', fontWeight: '700' }}>{c.low_stock_count} items</span>
                        ) : (
                          <span style={{ color: '#16B979' }}>0 items</span>
                        )}
                      </td>
                      <td style={{ paddingRight: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ flex: 1, background: '#F1F4FA', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${share}%`, background: c.color || '#405BFF', height: '100%' }} />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#101A46', width: '36px' }}>{share}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION E: TRANSACTION REPORT */}
      {activeTab === 'transactions' && (
        <div className="stock-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #E7ECF7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#101A46' }}>
              Detailed Transaction Audit Ledger
            </h3>
            <span style={{ fontSize: '12px', color: '#727D9E' }}>
              Showing {transactions.length} records
            </span>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '24px' }}>ID</th>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>Previous</th>
                  <th>Resulting</th>
                  <th>Recipient / Supplier</th>
                  <th>Ref #</th>
                  <th style={{ paddingRight: '24px' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td style={{ paddingLeft: '24px', color: '#727D9E', fontWeight: '600' }}>#{t.id}</td>
                    <td style={{ fontWeight: '700', color: '#101A46' }}>{t.product_name} [{t.product_sku}]</td>
                    <td>
                      <span className={t.type === 'IN' ? 'badge-in' : 'badge-out'}>{t.type}</span>
                    </td>
                    <td style={{ fontWeight: '800', color: t.type === 'IN' ? '#16B979' : '#FF525C' }}>
                      {t.type === 'IN' ? `+${t.quantity}` : `-${t.quantity}`}
                    </td>
                    <td>{t.previous_quantity}</td>
                    <td style={{ fontWeight: '700' }}>{t.new_quantity}</td>
                    <td>{t.recipient_destination || t.supplier_name || '—'}</td>
                    <td><span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{t.reference_number}</span></td>
                    <td style={{ paddingRight: '24px', color: '#727D9E', fontSize: '12px' }}>{t.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <NotificationToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default ReportsPage;
