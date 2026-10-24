import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes,
  Layers,
  AlertTriangle,
  XCircle,
  Calendar as CalendarIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/api';
import StatCard from '../components/StatCard';
import StockOverviewChart from '../components/StockOverviewChart';
import CategoryDistributionChart from '../components/CategoryDistributionChart';
import RecentTransactionsTable from '../components/RecentTransactionsTable';
import LowStockAlertsWidget from '../components/LowStockAlertsWidget';
import AiBannerCard from '../components/AiBannerCard';

export const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [stockOverview, setStockOverview] = useState([]);
  const [chartRange, setChartRange] = useState('6months');
  const [categoryDistribution, setCategoryDistribution] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Formatted date matching image: "Saturday, 24 October 2026"
  const formattedDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const fetchDashboardData = async (range = chartRange) => {
    try {
      const [statsRes, overviewRes, distRes, txRes, alertsRes] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getStockOverview(range),
        dashboardService.getCategoryDistribution(),
        dashboardService.getRecentTransactions(),
        dashboardService.getLowStockAlerts()
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (overviewRes.success) setStockOverview(overviewRes.data);
      if (distRes.success) {
        setCategoryDistribution(distRes.distribution);
        setTotalProducts(distRes.totalProducts);
      }
      if (txRes.success) setRecentTransactions(txRes.transactions);
      if (alertsRes.success) setLowStockAlerts(alertsRes.alerts);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(chartRange);
  }, []);

  const handleRangeChange = async (newRange) => {
    setChartRange(newRange);
    try {
      const res = await dashboardService.getStockOverview(newRange);
      if (res.success) {
        setStockOverview(res.data);
      }
    } catch (err) {
      console.error('Failed to update chart range', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
      {/* Top Header Row matching reference image */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '28px',
              fontWeight: '800',
              color: '#101A46',
              letterSpacing: '-0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            Welcome back, {user?.name?.split(' ')[0] || 'Admin'}! 👋
          </h2>
          <p style={{ fontSize: '14px', color: '#727D9E', marginTop: '4px' }}>
            Here's what's happening with your inventory today.
          </p>
        </div>

        {/* Calendar Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#FFFFFF',
            border: '1px solid #E7ECF7',
            borderRadius: '12px',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: '600',
            color: '#576282',
            boxShadow: '0 2px 8px rgba(64, 91, 255, 0.04)'
          }}
        >
          <CalendarIcon size={16} color="#727D9E" />
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* 4 Summary Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px'
        }}
      >
        <StatCard
          title="Total Products"
          value={stats?.totalProducts?.value ?? 48}
          trend={stats?.totalProducts?.trend ?? '+12% vs last month'}
          trendPositive={true}
          icon={Boxes}
          iconBg="#EEF2FF"
          iconColor="#405BFF"
          onClick={() => navigate('/products')}
        />

        <StatCard
          title="Total Stock Units"
          value={stats?.totalStockUnits?.value ?? '1,284'}
          trend={stats?.totalStockUnits?.trend ?? '+8% vs last month'}
          trendPositive={true}
          icon={Layers}
          iconBg="#E8FBF3"
          iconColor="#16B979"
          onClick={() => navigate('/stock')}
        />

        <StatCard
          title="Low Stock Items"
          value={stats?.lowStockItems?.value ?? 7}
          trend={stats?.lowStockItems?.trend ?? '+3 need restocking'}
          trendPositive={false}
          icon={AlertTriangle}
          iconBg="#FFF7ED"
          iconColor="#FF9B38"
          onClick={() => navigate('/products?status=low_stock')}
        />

        <StatCard
          title="Out of Stock"
          value={stats?.outOfStock?.value ?? 2}
          trend={stats?.outOfStock?.trend ?? '+1 items unavailable'}
          trendPositive={false}
          icon={XCircle}
          iconBg="#FEF2F2"
          iconColor="#FF525C"
          onClick={() => navigate('/products?status=out_of_stock')}
        />
      </div>

      {/* Middle Section: Stock Overview Chart (65%) & Category Distribution (35%) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.8fr 1fr',
          gap: '22px'
        }}
        className="dashboard-charts-grid"
      >
        <StockOverviewChart
          data={stockOverview}
          currentRange={chartRange}
          onRangeChange={handleRangeChange}
        />

        <CategoryDistributionChart
          distribution={categoryDistribution}
          totalProducts={totalProducts}
        />
      </div>

      {/* Bottom Section: Recent Transactions (65%) & Low Stock / AI Banner (35%) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.8fr 1fr',
          gap: '22px',
          alignItems: 'start'
        }}
        className="dashboard-bottom-grid"
      >
        {/* Left: Recent Transactions Table */}
        <RecentTransactionsTable transactions={recentTransactions} />

        {/* Right: Low Stock Alerts + AI Inventory Assistant */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <LowStockAlertsWidget alerts={lowStockAlerts} />
          <AiBannerCard />
        </div>
      </div>

      {/* Responsive Grid Tweaks */}
      <style>{`
        @media (max-width: 1100px) {
          .dashboard-charts-grid,
          .dashboard-bottom-grid {
            grid-templateColumns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;
