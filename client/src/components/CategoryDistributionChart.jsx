import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';

const DEFAULT_COLORS = ['#405BFF', '#8267F5', '#16B979', '#FF9B38', '#727D9E'];

export const CategoryDistributionChart = ({ distribution = [], totalProducts = 48 }) => {
  const chartData = distribution.length > 0
    ? distribution
    : [
        { name: 'Electronics', product_count: 17, percentage: 35, color: '#405BFF' },
        { name: 'Accessories', product_count: 12, percentage: 25, color: '#8267F5' },
        { name: 'Furniture', product_count: 7, percentage: 15, color: '#16B979' },
        { name: 'Lab Equipment', product_count: 7, percentage: 15, color: '#FF9B38' },
        { name: 'Others', product_count: 5, percentage: 10, color: '#727D9E' }
      ];

  const total = totalProducts || chartData.reduce((acc, c) => acc + (c.product_count || 0), 0);

  return (
    <div
      className="stock-card"
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '380px'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <PieIcon size={20} color="#FF9B38" strokeWidth={2.4} />
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#101A46' }}>
          Category Distribution
        </h3>
      </div>

      {/* Main Body: Donut on Left, List on Right */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flex: 1,
          gap: '16px'
        }}
        className="category-distribution-body"
      >
        {/* Donut with Center Text */}
        <div style={{ position: 'relative', width: '180px', height: '180px', flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="product_count"
                nameKey="name"
                innerRadius={58}
                outerRadius={84}
                paddingAngle={3}
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #E7ECF7',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          fontSize: '12px'
                        }}
                      >
                        <p style={{ fontWeight: '600', color: '#101A46' }}>{item.name}</p>
                        <p style={{ color: '#727D9E' }}>
                          {item.product_count} products ({item.percentage}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Centered Total Overlay */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none'
            }}
          >
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#101A46', lineHeight: '1.1' }}>
              {total}
            </div>
            <div style={{ fontSize: '11px', color: '#727D9E', fontWeight: '600' }}>
              Products
            </div>
          </div>
        </div>

        {/* Legend List */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {chartData.map((item, idx) => {
            const color = item.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
            return (
              <div
                key={item.name || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '13px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: color,
                      flexShrink: 0
                    }}
                  />
                  <span style={{ color: '#576282', fontWeight: '500' }}>
                    {item.name}
                  </span>
                </div>
                <span style={{ fontWeight: '700', color: '#101A46' }}>
                  {item.percentage}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoryDistributionChart;
