import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { BarChart3, ChevronDown } from 'lucide-react';

export const StockOverviewChart = ({ data = [], onRangeChange, currentRange = '6months' }) => {
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BarChart3 size={20} color="#405BFF" strokeWidth={2.4} />
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#101A46' }}>
            Stock Overview
          </h3>
        </div>

        {/* Dropdown Selector */}
        <div style={{ position: 'relative' }}>
          <select
            value={currentRange}
            onChange={(e) => onRangeChange && onRangeChange(e.target.value)}
            style={{
              appearance: 'none',
              background: '#F6F8FF',
              border: '1px solid #E7ECF7',
              borderRadius: '10px',
              padding: '7px 32px 7px 14px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#576282',
              cursor: 'pointer'
            }}
          >
            <option value="6months">Last 6 Months</option>
            <option value="30days">Last 30 Days</option>
            <option value="7days">Last 7 Days</option>
          </select>
          <ChevronDown
            size={14}
            color="#727D9E"
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none'
            }}
          />
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '18px', fontSize: '12.5px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#405BFF' }} />
          <span style={{ color: '#576282', fontWeight: '500' }}>Stock In</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#16B979' }} />
          <span style={{ color: '#576282', fontWeight: '500' }}>Stock Out</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#8267F5' }} />
          <span style={{ color: '#576282', fontWeight: '500' }}>Current Stock</span>
        </div>
      </div>

      {/* Chart */}
      <div style={{ width: '100%', flex: 1, minHeight: '260px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorStockIn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#405BFF" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#405BFF" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorStockOut" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16B979" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#16B979" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorCurrentStock" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8267F5" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#8267F5" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EDF2F7" />
            <XAxis
              dataKey="name"
              stroke="#A0AEC0"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              dy={6}
            />
            <YAxis
              stroke="#A0AEC0"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              dx={-4}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E7ECF7',
                        borderRadius: '12px',
                        padding: '12px 14px',
                        boxShadow: '0 8px 24px rgba(16, 26, 70, 0.12)'
                      }}
                    >
                      <p style={{ fontWeight: '700', fontSize: '13px', color: '#101A46', marginBottom: '8px' }}>
                        {label}
                      </p>
                      {payload.map((entry, index) => (
                        <div
                          key={`item-${index}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '16px',
                            fontSize: '12px',
                            margin: '4px 0'
                          }}
                        >
                          <span style={{ color: '#727D9E', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.color }} />
                            {entry.name === 'stockIn' ? 'Stock In' : entry.name === 'stockOut' ? 'Stock Out' : 'Current Stock'}:
                          </span>
                          <strong style={{ color: '#101A46' }}>{entry.value} units</strong>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />

            <Area
              type="monotone"
              dataKey="currentStock"
              stroke="#8267F5"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorCurrentStock)"
            />
            <Area
              type="monotone"
              dataKey="stockIn"
              stroke="#405BFF"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorStockIn)"
            />
            <Area
              type="monotone"
              dataKey="stockOut"
              stroke="#16B979"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorStockOut)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StockOverviewChart;
