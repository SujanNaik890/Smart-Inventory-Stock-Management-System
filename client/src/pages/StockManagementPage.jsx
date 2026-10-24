import React, { useState, useEffect } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Search,
  CheckCircle2,
  AlertTriangle,
  Package,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { stockService, productService, supplierService } from '../services/api';
import NotificationToast from '../components/NotificationToast';

export const StockManagementPage = () => {
  const [activeTab, setActiveTab] = useState('in'); // 'in' or 'out'
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters for Transactions
  const [txFilterType, setTxFilterType] = useState('all');
  const [txSearch, setTxSearch] = useState('');
  const [txPage, setTxPage] = useState(1);
  const [totalTxPages, setTotalTxPages] = useState(1);

  // Stock In Form
  const [inProductId, setInProductId] = useState('');
  const [inQuantity, setInQuantity] = useState('');
  const [inSupplierId, setInSupplierId] = useState('');
  const [inRefNumber, setInRefNumber] = useState('');
  const [inUnitCost, setInUnitCost] = useState('');
  const [inNotes, setInNotes] = useState('');
  const [inSubmitting, setInSubmitting] = useState(false);
  const [inError, setInError] = useState('');

  // Stock Out Form
  const [outProductId, setOutProductId] = useState('');
  const [outQuantity, setOutQuantity] = useState('');
  const [outDestination, setOutDestination] = useState('');
  const [outReason, setOutReason] = useState('Lab Allocation');
  const [outRefNumber, setOutRefNumber] = useState('');
  const [outNotes, setOutNotes] = useState('');
  const [outSubmitting, setOutSubmitting] = useState(false);
  const [outError, setOutError] = useState('');

  // Toast feedback
  const [toast, setToast] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, supRes, txRes] = await Promise.all([
        productService.getAll({ limit: 200 }),
        supplierService.getAll(),
        stockService.getTransactions({
          type: txFilterType,
          search: txSearch,
          page: txPage,
          limit: 20
        })
      ]);

      if (prodRes.success) setProducts(prodRes.products || []);
      if (supRes.success) setSuppliers(supRes.suppliers || []);
      if (txRes.success) {
        setTransactions(txRes.transactions || []);
        setTotalTxPages(txRes.totalPages || 1);
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [txFilterType, txSearch, txPage]);

  // Selected product details
  const selectedInProduct = products.find(p => p.id === Number(inProductId));
  const selectedOutProduct = products.find(p => p.id === Number(outProductId));

  // Handle Stock IN Submit
  const handleStockInSubmit = async (e) => {
    e.preventDefault();
    setInError('');

    if (!inProductId) {
      setInError('Please select a product.');
      return;
    }
    const qty = parseInt(inQuantity);
    if (isNaN(qty) || qty <= 0) {
      setInError('Quantity must be a positive integer greater than zero.');
      return;
    }

    try {
      setInSubmitting(true);
      const res = await stockService.stockIn({
        product_id: Number(inProductId),
        quantity: qty,
        supplier_id: inSupplierId ? Number(inSupplierId) : null,
        reference_number: inRefNumber || `PO-${Date.now().toString().slice(-6)}`,
        unit_cost: inUnitCost ? Number(inUnitCost) : undefined,
        notes: inNotes
      });

      setToast({ type: 'success', message: res.message });
      // Reset form
      setInQuantity('');
      setInRefNumber('');
      setInUnitCost('');
      setInNotes('');
      // Reload updated lists
      loadData();
    } catch (err) {
      setInError(err.message);
    } finally {
      setInSubmitting(false);
    }
  };

  // Handle Stock OUT Submit
  const handleStockOutSubmit = async (e) => {
    e.preventDefault();
    setOutError('');

    if (!outProductId) {
      setOutError('Please select a product.');
      return;
    }
    const qty = parseInt(outQuantity);
    if (isNaN(qty) || qty <= 0) {
      setOutError('Quantity must be a positive integer greater than zero.');
      return;
    }

    if (selectedOutProduct && qty > selectedOutProduct.quantity) {
      setOutError(`Requested quantity (${qty}) exceeds available stock (${selectedOutProduct.quantity} ${selectedOutProduct.unit}). Negative inventory is strictly prohibited.`);
      return;
    }

    try {
      setOutSubmitting(true);
      const res = await stockService.stockOut({
        product_id: Number(outProductId),
        quantity: qty,
        recipient_destination: outDestination || 'General Issue',
        reference_number: outRefNumber || `ISSUE-${Date.now().toString().slice(-6)}`,
        reason: outReason,
        notes: outNotes
      });

      setToast({ type: 'success', message: res.message });
      // Reset form
      setOutQuantity('');
      setOutDestination('');
      setOutRefNumber('');
      setOutNotes('');
      // Reload updated lists
      loadData();
    } catch (err) {
      setOutError(err.message);
    } finally {
      setOutSubmitting(false);
    }
  };

  const handleExportTxCSV = () => {
    if (transactions.length === 0) return;
    const headers = ['Tx ID', 'Product', 'SKU', 'Type', 'Quantity', 'Previous Qty', 'New Qty', 'Supplier / Recipient', 'Reference', 'Reason', 'Date'];
    const rows = transactions.map(t => [
      t.id,
      `"${t.product_name.replace(/"/g, '""')}"`,
      t.product_sku,
      t.type,
      t.quantity,
      t.previous_quantity,
      t.new_quantity,
      `"${(t.recipient_destination || t.supplier_name || 'N/A').replace(/"/g, '""')}"`,
      `"${t.reference_number || ''}"`,
      `"${(t.reason || '').replace(/"/g, '""')}"`,
      t.created_at
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Stock_Transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#101A46', letterSpacing: '-0.4px' }}>
            Stock Management
          </h2>
          <p style={{ fontSize: '14px', color: '#727D9E', marginTop: '4px' }}>
            Record stock intake purchases and issues with guaranteed atomic inventory updates.
          </p>
        </div>

        <button onClick={handleExportTxCSV} className="btn-secondary">
          <FileSpreadsheet size={16} />
          <span>Export Audit History</span>
        </button>
      </div>

      {/* Tabs for Stock In & Stock Out Operations */}
      <div style={{ display: 'flex', gap: '14px' }}>
        <button
          onClick={() => setActiveTab('in')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 24px',
            borderRadius: '14px',
            fontWeight: '700',
            fontSize: '14px',
            background: activeTab === 'in' ? '#E8FBF3' : '#FFFFFF',
            color: activeTab === 'in' ? '#16B979' : '#576282',
            border: `1px solid ${activeTab === 'in' ? '#A7F3D0' : '#E7ECF7'}`,
            transition: 'all 0.15s ease'
          }}
        >
          <ArrowDownLeft size={18} strokeWidth={2.4} />
          <span>Stock In (Purchase &amp; Intake)</span>
        </button>

        <button
          onClick={() => setActiveTab('out')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 24px',
            borderRadius: '14px',
            fontWeight: '700',
            fontSize: '14px',
            background: activeTab === 'out' ? '#FFF1F0' : '#FFFFFF',
            color: activeTab === 'out' ? '#FF525C' : '#576282',
            border: `1px solid ${activeTab === 'out' ? '#FECACA' : '#E7ECF7'}`,
            transition: 'all 0.15s ease'
          }}
        >
          <ArrowUpRight size={18} strokeWidth={2.4} />
          <span>Stock Out (Issue &amp; Consumption)</span>
        </button>
      </div>

      {/* Operation Forms Container */}
      <div className="stock-card" style={{ padding: '28px 32px' }}>
        {activeTab === 'in' ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#E8FBF3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16B979' }}>
                <ArrowDownLeft size={22} strokeWidth={2.4} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#101A46' }}>Record Stock Intake</h3>
                <p style={{ fontSize: '12.5px', color: '#727D9E' }}>Formula: <code>newQuantity = currentQuantity + purchasedQuantity</code></p>
              </div>
            </div>

            {inError && (
              <div style={{ background: '#FFF1F0', color: '#DC2626', border: '1px solid #FECACA', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', marginBottom: '18px' }}>
                {inError}
              </div>
            )}

            <form onSubmit={handleStockInSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#101A46', marginBottom: '6px' }}>
                    Select Product *
                  </label>
                  <select
                    value={inProductId}
                    onChange={(e) => setInProductId(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '0 14px',
                      borderRadius: '10px',
                      border: '1px solid #E7ECF7',
                      background: '#F9FAFF',
                      fontSize: '13.5px'
                    }}
                  >
                    <option value="">-- Choose a Product --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} [{p.sku}] (Current: {p.quantity} {p.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#101A46', marginBottom: '6px' }}>
                    Purchased Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={inQuantity}
                    onChange={(e) => setInQuantity(e.target.value)}
                    placeholder="e.g. 50"
                    required
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '0 14px',
                      borderRadius: '10px',
                      border: '1px solid #E7ECF7',
                      background: '#F9FAFF',
                      fontSize: '13.5px'
                    }}
                  />
                </div>
              </div>

              {/* Dynamic Live Calculation preview */}
              {selectedInProduct && inQuantity && Number(inQuantity) > 0 && (
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '12px 18px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '14px', fontSize: '13.5px' }}>
                  <CheckCircle2 size={20} color="#16B979" />
                  <span style={{ color: '#166534' }}>
                    Current Stock: <strong>{selectedInProduct.quantity}</strong> + Intake: <strong>{inQuantity}</strong> &rarr; New Stock Balance will be: <strong>{selectedInProduct.quantity + Number(inQuantity)} {selectedInProduct.unit}</strong>
                  </span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#101A46', marginBottom: '6px' }}>
                    Supplier
                  </label>
                  <select
                    value={inSupplierId}
                    onChange={(e) => setInSupplierId(e.target.value)}
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '0 14px',
                      borderRadius: '10px',
                      border: '1px solid #E7ECF7',
                      background: '#F9FAFF',
                      fontSize: '13.5px'
                    }}
                  >
                    <option value="">Default Product Vendor</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#101A46', marginBottom: '6px' }}>
                    PO / Invoice Reference
                  </label>
                  <input
                    type="text"
                    value={inRefNumber}
                    onChange={(e) => setInRefNumber(e.target.value)}
                    placeholder="e.g. PO-2026-904"
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '0 14px',
                      borderRadius: '10px',
                      border: '1px solid #E7ECF7',
                      background: '#F9FAFF',
                      fontSize: '13.5px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#101A46', marginBottom: '6px' }}>
                    Unit Cost ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={inUnitCost}
                    onChange={(e) => setInUnitCost(e.target.value)}
                    placeholder="Optional unit cost"
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '0 14px',
                      borderRadius: '10px',
                      border: '1px solid #E7ECF7',
                      background: '#F9FAFF',
                      fontSize: '13.5px'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#101A46', marginBottom: '6px' }}>
                  Intake Notes / Batch Details
                </label>
                <input
                  type="text"
                  value={inNotes}
                  onChange={(e) => setInNotes(e.target.value)}
                  placeholder="e.g. Received via Apex Distribution, inspected for QA clearance"
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 14px',
                    borderRadius: '10px',
                    border: '1px solid #E7ECF7',
                    background: '#F9FAFF',
                    fontSize: '13.5px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="submit"
                  disabled={inSubmitting}
                  className="btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                    padding: '12px 28px'
                  }}
                >
                  {inSubmitting ? 'Recording Intake...' : 'Submit Stock In & Update Inventory'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#FFF1F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF525C' }}>
                <ArrowUpRight size={22} strokeWidth={2.4} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#101A46' }}>Record Stock Issue / Allocation</h3>
                <p style={{ fontSize: '12.5px', color: '#727D9E' }}>Formula: <code>newQuantity = currentQuantity - issuedQuantity</code> (Negative stock is prevented)</p>
              </div>
            </div>

            {outError && (
              <div style={{ background: '#FFF1F0', color: '#DC2626', border: '1px solid #FECACA', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', marginBottom: '18px' }}>
                {outError}
              </div>
            )}

            <form onSubmit={handleStockOutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#101A46', marginBottom: '6px' }}>
                    Select Product to Issue *
                  </label>
                  <select
                    value={outProductId}
                    onChange={(e) => setOutProductId(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '0 14px',
                      borderRadius: '10px',
                      border: '1px solid #E7ECF7',
                      background: '#F9FAFF',
                      fontSize: '13.5px'
                    }}
                  >
                    <option value="">-- Choose a Product --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id} disabled={p.quantity <= 0}>
                        {p.name} [{p.sku}] — Available: {p.quantity} {p.unit} {p.quantity <= 0 ? '(DEPLETED)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#101A46', marginBottom: '6px' }}>
                    Issue Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedOutProduct ? selectedOutProduct.quantity : undefined}
                    value={outQuantity}
                    onChange={(e) => setOutQuantity(e.target.value)}
                    placeholder="e.g. 5"
                    required
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '0 14px',
                      borderRadius: '10px',
                      border: '1px solid #E7ECF7',
                      background: '#F9FAFF',
                      fontSize: '13.5px'
                    }}
                  />
                </div>
              </div>

              {/* Dynamic Live Calculation preview */}
              {selectedOutProduct && outQuantity && Number(outQuantity) > 0 && (
                <div
                  style={{
                    background: Number(outQuantity) > selectedOutProduct.quantity ? '#FEF2F2' : '#EFF6FF',
                    border: `1px solid ${Number(outQuantity) > selectedOutProduct.quantity ? '#FCA5A5' : '#BFDBFE'}`,
                    padding: '12px 18px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    fontSize: '13.5px'
                  }}
                >
                  <AlertTriangle size={20} color={Number(outQuantity) > selectedOutProduct.quantity ? '#DC2626' : '#2563EB'} />
                  {Number(outQuantity) > selectedOutProduct.quantity ? (
                    <span style={{ color: '#991B1B', fontWeight: '600' }}>
                      Error: Cannot issue {outQuantity} units! Available balance is only {selectedOutProduct.quantity} {selectedOutProduct.unit}.
                    </span>
                  ) : (
                    <span style={{ color: '#1E40AF' }}>
                      Available Stock: <strong>{selectedOutProduct.quantity}</strong> &minus; Issue: <strong>{outQuantity}</strong> &rarr; Resulting Balance will be: <strong>{selectedOutProduct.quantity - Number(outQuantity)} {selectedOutProduct.unit}</strong>
                    </span>
                  )}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#101A46', marginBottom: '6px' }}>
                    Destination / Department / Recipient *
                  </label>
                  <input
                    type="text"
                    value={outDestination}
                    onChange={(e) => setOutDestination(e.target.value)}
                    placeholder="e.g. Computer Science Lab 3, Prof. Miller"
                    required
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '0 14px',
                      borderRadius: '10px',
                      border: '1px solid #E7ECF7',
                      background: '#F9FAFF',
                      fontSize: '13.5px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#101A46', marginBottom: '6px' }}>
                    Reason for Issue
                  </label>
                  <select
                    value={outReason}
                    onChange={(e) => setOutReason(e.target.value)}
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '0 14px',
                      borderRadius: '10px',
                      border: '1px solid #E7ECF7',
                      background: '#F9FAFF',
                      fontSize: '13.5px'
                    }}
                  >
                    <option value="Lab Allocation">Lab Allocation / Practical Class</option>
                    <option value="Departmental Use">Departmental Workstation Setup</option>
                    <option value="Maintenance / Repair">Maintenance &amp; Repair Replacement</option>
                    <option value="Research Project">Research Grant Project</option>
                    <option value="Damaged / Write-Off">Damaged / Write-Off</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#101A46', marginBottom: '6px' }}>
                    Issue Slip #
                  </label>
                  <input
                    type="text"
                    value={outRefNumber}
                    onChange={(e) => setOutRefNumber(e.target.value)}
                    placeholder="e.g. ISSUE-2026-110"
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '0 14px',
                      borderRadius: '10px',
                      border: '1px solid #E7ECF7',
                      background: '#F9FAFF',
                      fontSize: '13.5px'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#101A46', marginBottom: '6px' }}>
                  Issue Notes / Authorization
                </label>
                <input
                  type="text"
                  value={outNotes}
                  onChange={(e) => setOutNotes(e.target.value)}
                  placeholder="e.g. Approved by Head of Department for Semester 2 robotics experiments"
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 14px',
                    borderRadius: '10px',
                    border: '1px solid #E7ECF7',
                    background: '#F9FAFF',
                    fontSize: '13.5px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="submit"
                  disabled={outSubmitting}
                  className="btn-danger"
                  style={{
                    padding: '12px 28px',
                    borderRadius: '9999px',
                    fontSize: '14px',
                    fontWeight: '700'
                  }}
                >
                  {outSubmitting ? 'Verifying & Issuing...' : 'Authorize & Issue Stock Out'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Transaction History Section */}
      <div className="stock-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #E7ECF7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ArrowLeftRight size={20} color="#405BFF" strokeWidth={2.4} />
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#101A46' }}>
              Real-time Transaction Audit Log
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Filter Type */}
            <select
              value={txFilterType}
              onChange={(e) => {
                setTxFilterType(e.target.value);
                setTxPage(1);
              }}
              style={{
                height: '38px',
                background: '#F6F8FF',
                border: '1px solid #E7ECF7',
                borderRadius: '10px',
                padding: '0 12px',
                fontSize: '13px',
                color: '#576282'
              }}
            >
              <option value="all">All Movements (IN &amp; OUT)</option>
              <option value="IN">Purchases (IN Only)</option>
              <option value="OUT">Issues (OUT Only)</option>
            </select>

            {/* Keyword Search */}
            <div style={{ position: 'relative' }}>
              <Search size={16} color="#727D9E" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={txSearch}
                onChange={(e) => {
                  setTxSearch(e.target.value);
                  setTxPage(1);
                }}
                placeholder="Filter by ref, dest, product..."
                style={{
                  height: '38px',
                  paddingLeft: '36px',
                  paddingRight: '12px',
                  background: '#F6F8FF',
                  border: '1px solid #E7ECF7',
                  borderRadius: '10px',
                  fontSize: '13px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: '24px' }}>Tx #</th>
                <th>Product</th>
                <th>Movement</th>
                <th>Qty</th>
                <th>Balance Shift</th>
                <th>Supplier / Destination</th>
                <th>Reference #</th>
                <th>Reason &amp; Notes</th>
                <th style={{ paddingRight: '24px' }}>Recorded At</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#727D9E' }}>
                    Loading transaction ledger...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#727D9E' }}>
                    No transactions match current filters.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => {
                  const isIn = t.type === 'IN';
                  return (
                    <tr key={t.id}>
                      <td style={{ paddingLeft: '24px', color: '#727D9E', fontWeight: '600' }}>
                        #{t.id}
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F1F4FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Package size={16} color="#727D9E" />
                          </div>
                          <div>
                            <span style={{ fontWeight: '700', color: '#101A46', display: 'block' }}>{t.product_name}</span>
                            <span style={{ fontSize: '11px', color: '#727D9E' }}>{t.product_sku}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={isIn ? 'badge-in' : 'badge-out'}>
                          {t.type}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontWeight: '800', color: isIn ? '#16B979' : '#FF525C', fontSize: '14px' }}>
                          {isIn ? `+${t.quantity}` : `-${t.quantity}`}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: '12.5px', color: '#576282' }}>
                          {t.previous_quantity} &rarr; <strong style={{ color: '#101A46' }}>{t.new_quantity}</strong>
                        </span>
                      </td>

                      <td style={{ fontSize: '13px', color: '#101A46' }}>
                        {t.recipient_destination || t.supplier_name || '—'}
                      </td>

                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '12px', background: '#F1F4FA', padding: '2px 8px', borderRadius: '6px' }}>
                          {t.reference_number}
                        </span>
                      </td>

                      <td>
                        <p style={{ fontSize: '12.5px', fontWeight: '600', color: '#101A46' }}>{t.reason || 'General'}</p>
                        {t.notes && <p style={{ fontSize: '11px', color: '#727D9E' }}>{t.notes}</p>}
                      </td>

                      <td style={{ paddingRight: '24px', fontSize: '12px', color: '#727D9E' }}>
                        {t.created_at}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalTxPages > 1 && (
          <div style={{ padding: '14px 24px', borderTop: '1px solid #E7ECF7', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              disabled={txPage <= 1}
              onClick={() => setTxPage(p => p - 1)}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              Previous
            </button>
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: '12px', fontWeight: '600' }}>
              Page {txPage} of {totalTxPages}
            </span>
            <button
              disabled={txPage >= totalTxPages}
              onClick={() => setTxPage(p => p + 1)}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      <NotificationToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default StockManagementPage;
