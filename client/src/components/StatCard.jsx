import React from 'react';
import { ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  trend,
  trendPositive = true,
  icon: Icon,
  iconBg,
  iconColor,
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className="stock-card"
      style={{
        padding: '22px 24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: onClick ? 'pointer' : 'default',
        minHeight: '150px'
      }}
    >
      {/* Top Row: Icon + Title + Arrow */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: iconColor
            }}
          >
            {Icon && <Icon size={24} strokeWidth={2.2} />}
          </div>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#576282' }}>
            {title}
          </span>
        </div>

        <button
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            border: '1px solid #E7ECF7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#727D9E',
            transition: 'all 0.15s ease'
          }}
          className="stat-card-arrow"
          aria-label={`View ${title}`}
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Bottom Area: Large Number + Trend */}
      <div style={{ marginTop: '18px' }}>
        <h3
          style={{
            fontSize: '32px',
            fontWeight: '800',
            color: '#101A46',
            letterSpacing: '-0.5px',
            lineHeight: '1.1',
            marginBottom: '6px'
          }}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </h3>

        {trend && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            {trendPositive ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  color: '#16B979',
                  fontWeight: '700'
                }}
              >
                <TrendingUp size={14} />
                {trend.split(' ')[0]}
              </span>
            ) : (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  color: '#FF525C',
                  fontWeight: '700'
                }}
              >
                <TrendingUp size={14} />
                {trend.split(' ')[0]}
              </span>
            )}
            <span style={{ color: '#727D9E', fontWeight: '500' }}>
              {trend.split(' ').slice(1).join(' ')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
