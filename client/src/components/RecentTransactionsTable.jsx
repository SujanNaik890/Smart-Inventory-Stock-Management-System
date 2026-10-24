import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, Package } from 'lucide-react';

export const RecentTransactionsTable = ({ transactions = [] }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ', ' + date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div
      className="stock-card"
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ArrowLeftRight size={20} color="#405BFF" strokeWidth={2.4} />
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#101A46' }}>
            Recent Stock Transactions
          </h3>
        </div>

        <Link
          to="/stock"
          style={{
            fontSize: '13px',
            fontWeight: '700',
            color: '#405BFF',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          View All &rarr;
        </Link>
      </div>

      {/* Table */}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>#</th>
              <th>Product Name</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Date &amp; Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '28px', color: '#727D9E' }}>
                  No recent stock transactions recorded.
                </td>
              </tr>
            ) : (
              transactions.map((tx, idx) => {
                const isIn = tx.type === 'IN';
                return (
                  <tr key={tx.id || idx}>
                    <td style={{ color: '#727D9E', fontWeight: '600' }}>
                      {idx + 1}
                    </td>

                    {/* Product Name with Thumbnail */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: '#F1F4FA',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            flexShrink: 0
                          }}
                        >
                          {tx.product_image ? (
                            <img
                              src={tx.product_image}
                              alt={tx.product_name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <Package size={18} color="#727D9E" />
                          )}
                        </div>
                        <div>
                          <span style={{ fontWeight: '600', color: '#101A46', display: 'block' }}>
                            {tx.product_name}
                          </span>
                          <span style={{ fontSize: '11px', color: '#727D9E' }}>
                            {tx.product_sku || tx.reference_number}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Type Badge */}
                    <td>
                      <span className={isIn ? 'badge-in' : 'badge-out'}>
                        {tx.type}
                      </span>
                    </td>

                    {/* Quantity with +/- prefix and color */}
                    <td>
                      <span
                        style={{
                          fontWeight: '700',
                          color: isIn ? '#16B979' : '#FF525C',
                          fontSize: '13.5px'
                        }}
                      >
                        {isIn ? `+${tx.quantity}` : `-${tx.quantity}`}
                      </span>
                    </td>

                    {/* Date & Time */}
                    <td style={{ color: '#576282', fontSize: '12.5px' }}>
                      {formatDate(tx.created_at)}
                    </td>

                    {/* Status Badge */}
                    <td>
                      <span className="badge-completed">
                        {tx.status || 'Completed'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentTransactionsTable;
