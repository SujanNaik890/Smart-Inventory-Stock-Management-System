import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Package, AlertTriangle } from 'lucide-react';

export const LowStockAlertsWidget = ({ alerts = [] }) => {
  return (
    <div
      className="stock-card"
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bell size={19} color="#FF525C" strokeWidth={2.4} />
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#101A46' }}>
            Low Stock Alerts
          </h3>
        </div>

        <Link
          to="/products?status=low_stock"
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

      {/* Alert Items List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {alerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: '#727D9E', fontSize: '13px' }}>
            All inventory levels are above minimum thresholds.
          </div>
        ) : (
          alerts.slice(0, 4).map((item) => {
            const isZero = item.quantity === 0;
            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 4px',
                  borderRadius: '10px',
                  transition: 'background 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Thumbnail */}
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#F6F8FF',
                      border: '1px solid #E7ECF7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}
                  >
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <Package size={20} color="#727D9E" />
                    )}
                  </div>

                  {/* Name and Units */}
                  <div>
                    <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: '#101A46' }}>
                      {item.name}
                    </h4>
                    <p style={{ fontSize: '12px', color: '#727D9E' }}>
                      <span style={{ color: '#FF525C', fontWeight: '700' }}>
                        {item.quantity}
                      </span>
                      {' / '}{item.minimum_stock} {item.unit || 'units'}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <span className={isZero ? 'badge-out-of-stock' : 'badge-low-stock'}>
                  {isZero ? 'Out of Stock' : 'Low Stock'}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LowStockAlertsWidget;
