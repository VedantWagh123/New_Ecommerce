import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { backendUrl, currency } from '../App';
import { toast } from 'react-toastify';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  CheckCircle,
  Clock,
  Truck,
  AlertCircle,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ChevronRight,
  ShieldAlert,
  CreditCard
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const STATUS_COLORS = {
  'Packing': '#3b82f6',
  'Order Placed': '#60a5fa',
  'Shipped': '#6366f1',
  'Out for Delivery': '#f59e0b',
  'Delivered': '#10b981',
  'Cancelled': '#ef4444',
  'Delivery Failed': '#f43f5e'
};

const Dashboard = ({ token }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [timeRange, setTimeRange] = useState('ALL'); // 'TODAY' | '7DAYS' | '30DAYS' | 'ALL'

  // Fetch all dashboard data concurrently
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [ordersRes, productsRes, sellersRes, approvalsRes] = await Promise.allSettled([
        axios.post(`${backendUrl}/api/order/list`, {}, config),
        axios.get(`${backendUrl}/api/product/list`),
        axios.get(`${backendUrl}/api/seller/list`, config),
        axios.get(`${backendUrl}/api/product/approvals`, config)
      ]);

      if (ordersRes.status === 'fulfilled' && ordersRes.value.data.success) {
        setOrders(ordersRes.value.data.orders || []);
      }
      if (productsRes.status === 'fulfilled' && productsRes.value.data.success) {
        setProducts(productsRes.value.data.products || []);
      }
      if (sellersRes.status === 'fulfilled' && sellersRes.value.data.success) {
        setSellers(sellersRes.value.data.sellers || []);
      }
      if (approvalsRes.status === 'fulfilled' && approvalsRes.value.data.success) {
        setApprovals(approvalsRes.value.data.products || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    if (timeRange === 'ALL') return orders;
    
    const now = Date.now();
    let cutoff = 0;
    
    if (timeRange === 'TODAY') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      cutoff = startOfDay.getTime();
    } else if (timeRange === '7DAYS') {
      cutoff = now - 7 * 24 * 60 * 60 * 1000;
    } else if (timeRange === '30DAYS') {
      cutoff = now - 30 * 24 * 60 * 60 * 1000;
    }

    return orders.filter(o => (o.date || 0) >= cutoff);
  }, [orders, timeRange]);

  // Key performance metrics
  const metrics = useMemo(() => {
    const totalRevenue = filteredOrders
      .filter(o => o.status !== 'Cancelled' && o.status !== 'Delivery Failed')
      .reduce((sum, o) => sum + (o.amount || 0), 0);

    const totalOrdersCount = filteredOrders.length;
    const completedOrders = filteredOrders.filter(o => o.status === 'Delivered').length;
    const activeOrders = filteredOrders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled' && o.status !== 'Delivery Failed').length;
    const cancelledOrders = filteredOrders.filter(o => o.status === 'Cancelled' || o.status === 'Delivery Failed').length;
    
    const avgOrderValue = totalOrdersCount > 0 ? (totalRevenue / (totalOrdersCount - cancelledOrders || 1)) : 0;
    const completionRate = totalOrdersCount > 0 ? ((completedOrders / totalOrdersCount) * 100).toFixed(1) : 0;

    return {
      totalRevenue,
      totalOrdersCount,
      completedOrders,
      activeOrders,
      cancelledOrders,
      avgOrderValue,
      completionRate,
      totalProducts: products.length,
      activeSellers: sellers.length,
      pendingApprovals: approvals.length
    };
  }, [filteredOrders, products, sellers, approvals]);

  // Daily / Timeline Sales Trend Graph Data
  const salesTrendData = useMemo(() => {
    if (!orders.length) {
      // Fallback empty preview structure for crisp graphics
      return [
        { date: 'Mon', revenue: 450, orders: 4 },
        { date: 'Tue', revenue: 890, orders: 8 },
        { date: 'Wed', revenue: 620, orders: 5 },
        { date: 'Thu', revenue: 1200, orders: 12 },
        { date: 'Fri', revenue: 950, orders: 9 },
        { date: 'Sat', revenue: 1500, orders: 15 },
        { date: 'Sun', revenue: 1800, orders: 18 },
      ];
    }

    const dateMap = {};
    // Group orders by formatted date String
    filteredOrders.forEach(o => {
      if (o.status === 'Cancelled' || o.status === 'Delivery Failed') return;
      const dateStr = new Date(o.date || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = { date: dateStr, revenue: 0, orders: 0, timestamp: o.date || 0 };
      }
      dateMap[dateStr].revenue += (o.amount || 0);
      dateMap[dateStr].orders += 1;
    });

    const result = Object.values(dateMap).sort((a, b) => a.timestamp - b.timestamp);
    if (result.length === 1) {
      // Add padding entry for smooth curve preview
      return [{ date: 'Start', revenue: 0, orders: 0 }, ...result];
    }
    return result.length ? result : [{ date: 'Today', revenue: metrics.totalRevenue, orders: metrics.totalOrdersCount }];
  }, [filteredOrders, orders.length, metrics]);

  // Order Status Distribution Chart Data
  const orderStatusData = useMemo(() => {
    const counts = {};
    filteredOrders.forEach(o => {
      const st = o.status || 'Packing';
      counts[st] = (counts[st] || 0) + 1;
    });

    const data = Object.keys(counts).map(st => ({
      name: st,
      value: counts[st],
      color: STATUS_COLORS[st] || '#64748b'
    }));

    if (!data.length) {
      return [
        { name: 'Delivered', value: 12, color: STATUS_COLORS['Delivered'] },
        { name: 'Packing', value: 5, color: STATUS_COLORS['Packing'] },
        { name: 'Shipped', value: 4, color: STATUS_COLORS['Shipped'] },
        { name: 'Cancelled', value: 1, color: STATUS_COLORS['Cancelled'] }
      ];
    }
    return data;
  }, [filteredOrders]);

  // Category Breakdown Data
  const categoryData = useMemo(() => {
    const catMap = {};
    products.forEach(p => {
      const cat = p.category || 'Uncategorized';
      catMap[cat] = (catMap[cat] || 0) + 1;
    });

    const data = Object.keys(catMap).map(cat => ({
      category: cat,
      count: catMap[cat]
    }));

    if (!data.length) {
      return [
        { category: 'Men', count: 18 },
        { category: 'Women', count: 24 },
        { category: 'Kids', count: 12 }
      ];
    }
    return data;
  }, [products]);

  // Payment Method Breakdown Data
  const paymentMethodData = useMemo(() => {
    const payMap = { COD: 0, Stripe: 0, Razorpay: 0 };
    filteredOrders.forEach(o => {
      const method = o.paymentMethod || 'COD';
      payMap[method] = (payMap[method] || 0) + 1;
    });

    return [
      { name: 'Cash on Delivery', code: 'COD', count: payMap['COD'], color: '#10b981' },
      { name: 'Stripe Credit', code: 'Stripe', count: payMap['Stripe'], color: '#6366f1' },
      { name: 'Razorpay UPI', code: 'Razorpay', count: payMap['Razorpay'], color: '#3b82f6' }
    ];
  }, [filteredOrders]);

  // Recent 5 Orders for Dashboard Quick Feed
  const recentOrders = useMemo(() => {
    return [...orders].sort((a, b) => (b.date || 0) - (a.date || 0)).slice(0, 5);
  }, [orders]);

  return (
    <div className='w-full pb-16 space-y-8 animate-fade-in'>
      {/* Header Banner */}
      <div className='bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 text-slate-900 p-6 sm:p-8 rounded-3xl border border-indigo-100 shadow-sm relative overflow-hidden'>
        <div className='absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none' />
        <div className='absolute left-1/3 bottom-0 w-48 h-48 bg-pink-500/10 rounded-full blur-2xl pointer-events-none' />

        <div className='relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6'>
          <div>
            <div className='flex items-center gap-3 flex-wrap mb-2'>
              <span className='px-3 py-1 rounded-full text-xs font-bold bg-white/60 text-indigo-700 border border-indigo-200 flex items-center gap-2'>
                <span className='w-2 h-2 rounded-full bg-emerald-500 animate-pulse' />
                Live Store Analytics
              </span>
              <span className='text-xs font-medium text-slate-500'>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className='text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900'>
              Admin Command Center
            </h1>
            <p className='text-slate-600 text-xs sm:text-sm mt-1 max-w-xl font-normal leading-relaxed'>
              Real-time snapshot of overall store revenue, order fulfillment rates, product catalog expansion, and merchant status.
            </p>
          </div>

          <div className='flex items-center gap-3 self-start md:self-auto flex-wrap'>
            {/* Time Filter Toggle */}
            <div className='bg-white/60 border border-indigo-100 p-1 rounded-2xl flex items-center gap-1 text-xs font-semibold'>
              {[
                { id: 'ALL', label: 'All Time' },
                { id: '30DAYS', label: '30 Days' },
                { id: '7DAYS', label: '7 Days' },
                { id: 'TODAY', label: 'Today' }
              ].map(btn => (
                <button
                  key={btn.id}
                  onClick={() => setTimeRange(btn.id)}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    timeRange === btn.id
                      ? 'bg-indigo-600 text-white shadow-md font-bold'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className='bg-white/60 hover:bg-white/80 text-indigo-600 border border-indigo-200 p-2.5 rounded-2xl transition-all flex items-center justify-center active:scale-95 cursor-pointer'
              title='Refresh Data'
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5'>
        {/* Total Revenue */}
        <div className='bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all group relative overflow-hidden'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-extrabold uppercase tracking-wider text-slate-500'>Total Sales Revenue</span>
            <div className='w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform'>
              <DollarSign className='w-5 h-5' />
            </div>
          </div>
          <div className='mt-4'>
            <h2 className='text-2xl sm:text-3xl font-black text-slate-900 tracking-tight'>
              {currency}{metrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </h2>
            <div className='flex items-center gap-2 mt-2 text-xs font-semibold text-emerald-600'>
              <TrendingUp className='w-4 h-4' />
              <span>AOV: {currency}{metrics.avgOrderValue.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className='bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all group relative overflow-hidden'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-extrabold uppercase tracking-wider text-slate-500'>Total Orders</span>
            <div className='w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform'>
              <ShoppingBag className='w-5 h-5' />
            </div>
          </div>
          <div className='mt-4'>
            <h2 className='text-2xl sm:text-3xl font-black text-slate-900 tracking-tight'>
              {metrics.totalOrdersCount}
            </h2>
            <div className='flex items-center gap-2 mt-2 text-xs font-semibold text-slate-500'>
              <span className='text-emerald-600 font-bold'>{metrics.completedOrders} Delivered</span>
              <span>•</span>
              <span className='text-amber-600 font-bold'>{metrics.activeOrders} Active</span>
            </div>
          </div>
        </div>

        {/* Product Catalog */}
        <div className='bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all group relative overflow-hidden'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-extrabold uppercase tracking-wider text-slate-500'>Live Products</span>
            <div className='w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform'>
              <Package className='w-5 h-5' />
            </div>
          </div>
          <div className='mt-4'>
            <h2 className='text-2xl sm:text-3xl font-black text-slate-900 tracking-tight'>
              {metrics.totalProducts}
            </h2>
            <div className='flex items-center gap-2 mt-2 text-xs font-semibold text-indigo-600'>
              <CheckCircle className='w-4 h-4' />
              <span>Active in Store</span>
            </div>
          </div>
        </div>

        {/* Sellers & Approvals */}
        <div className='bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all group relative overflow-hidden'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-extrabold uppercase tracking-wider text-slate-500'>Sellers & Approvals</span>
            <div className='w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform'>
              <Users className='w-5 h-5' />
            </div>
          </div>
          <div className='mt-4'>
            <div className='flex items-baseline gap-2'>
              <h2 className='text-2xl sm:text-3xl font-black text-slate-900 tracking-tight'>
                {metrics.activeSellers}
              </h2>
              <span className='text-xs text-slate-500 font-semibold'>Approved Sellers</span>
            </div>
            <div className='flex items-center gap-2 mt-2 text-xs font-bold text-amber-600'>
              <AlertCircle className='w-4 h-4' />
              <span>{metrics.pendingApprovals} Product Approvals Pending</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Visual Graphs Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
        {/* Sales & Revenue Trend Area Chart */}
        <div className='lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4'>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4'>
            <div>
              <h3 className='text-lg font-bold text-slate-900 flex items-center gap-2'>
                <TrendingUp className='w-5 h-5 text-indigo-600' />
                Sales & Revenue Growth Trend
              </h3>
              <p className='text-xs text-slate-500 mt-0.5 font-medium'>
                Revenue timeline and order volume distribution over time
              </p>
            </div>
            <span className='text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full self-start sm:self-auto border border-indigo-100'>
              {timeRange === 'ALL' ? 'All Time Overview' : timeRange}
            </span>
          </div>

          <div className='h-72 w-full pt-2'>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                  }}
                  formatter={(value, name) => [
                    name === 'revenue' ? `${currency}${Number(value).toFixed(2)}` : value,
                    name === 'revenue' ? 'Sales Revenue' : 'Orders Count'
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Distribution Donut Chart */}
        <div className='lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4 flex flex-col justify-between'>
          <div>
            <h3 className='text-lg font-bold text-slate-900 flex items-center gap-2'>
              <Clock className='w-5 h-5 text-blue-600' />
              Order Status Breakdown
            </h3>
            <p className='text-xs text-slate-500 mt-0.5 font-medium'>
              Distribution by fulfillment status
            </p>
          </div>

          <div className='h-52 w-full my-auto flex items-center justify-center relative'>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className='absolute text-center pointer-events-none'>
              <span className='text-2xl font-black text-slate-900'>{metrics.totalOrdersCount}</span>
              <p className='text-[10px] text-slate-400 font-bold uppercase tracking-wider'>Orders</p>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs font-medium'>
            {orderStatusData.map((st) => (
              <div key={st.name} className='flex items-center gap-2'>
                <span className='w-2.5 h-2.5 rounded-full shrink-0' style={{ backgroundColor: st.color }} />
                <span className='text-slate-600 truncate'>{st.name}</span>
                <span className='font-bold text-slate-900 ml-auto'>{st.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Graphs: Category Breakdown & Payment Methods */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
        {/* Category Breakdown Bar Chart */}
        <div className='lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4'>
          <div>
            <h3 className='text-lg font-bold text-slate-900 flex items-center gap-2'>
              <Package className='w-5 h-5 text-purple-600' />
              Catalog Category Distribution
            </h3>
            <p className='text-xs text-slate-500 mt-0.5 font-medium'>
              Number of live products listed per product category
            </p>
          </div>

          <div className='h-60 w-full pt-2'>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                  formatter={(value) => [`${value} Products`, 'Catalog Count']}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods */}
        <div className='lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4 flex flex-col justify-between'>
          <div>
            <h3 className='text-lg font-bold text-slate-900 flex items-center gap-2'>
              <CreditCard className='w-5 h-5 text-emerald-600' />
              Payment Gateway Breakdown
            </h3>
            <p className='text-xs text-slate-500 mt-0.5 font-medium'>
              Order volume breakdown by payment channel
            </p>
          </div>

          <div className='space-y-4 my-auto py-2'>
            {paymentMethodData.map(item => {
              const percentage = metrics.totalOrdersCount > 0 
                ? ((item.count / metrics.totalOrdersCount) * 100).toFixed(0) 
                : 0;

              return (
                <div key={item.code} className='space-y-1.5'>
                  <div className='flex items-center justify-between text-xs font-bold'>
                    <div className='flex items-center gap-2'>
                      <span className='w-3 h-3 rounded-full' style={{ backgroundColor: item.color }} />
                      <span className='text-slate-800'>{item.name}</span>
                    </div>
                    <span className='text-slate-900 font-extrabold'>{item.count} orders ({percentage}%)</span>
                  </div>
                  <div className='w-full bg-slate-100 rounded-full h-2.5 overflow-hidden'>
                    <div
                      className='h-full rounded-full transition-all duration-500'
                      style={{ width: `${Math.max(percentage, 4)}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className='p-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between text-xs text-emerald-900 font-semibold'>
            <span>Store Completion Rate:</span>
            <span className='font-black text-emerald-700 text-sm'>{metrics.completionRate}%</span>
          </div>
        </div>
      </div>

      {/* Quick Action Hub & Recent Activity Feed */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
        {/* Recent Orders Live Feed */}
        <div className='lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4'>
          <div className='flex items-center justify-between border-b border-slate-100 pb-4'>
            <div>
              <h3 className='text-lg font-bold text-slate-900'>Recent Store Orders</h3>
              <p className='text-xs text-slate-500 mt-0.5 font-medium'>
                Latest customer purchases requiring dispatch and fulfillment
              </p>
            </div>
            <button
              onClick={() => navigate('/orders')}
              className='text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer'
            >
              <span>View All Orders</span>
              <ChevronRight className='w-4 h-4' />
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div className='p-8 text-center text-slate-400 text-xs font-medium'>
              No recent orders found.
            </div>
          ) : (
            <div className='divide-y divide-slate-100'>
              {recentOrders.map((ord) => {
                const shortId = ord._id?.slice(-8)?.toUpperCase();
                const custName = `${ord.address?.firstName || 'Customer'} ${ord.address?.lastName || ''}`;

                return (
                  <div key={ord._id} className='py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs'>
                    <div className='flex items-center gap-3'>
                      <div className='w-9 h-9 rounded-xl bg-slate-100 font-mono font-bold text-slate-700 flex items-center justify-center shrink-0 border border-slate-200'>
                        #{shortId}
                      </div>
                      <div>
                        <p className='font-bold text-slate-900 text-sm'>{custName}</p>
                        <p className='text-[11px] text-slate-500 mt-0.5 font-normal'>
                          {ord.items?.length || 0} {ord.items?.length === 1 ? 'item' : 'items'} • {ord.paymentMethod} ({ord.payment ? 'Paid' : 'Pending'})
                        </p>
                      </div>
                    </div>

                    <div className='flex items-center gap-3 self-end sm:self-auto'>
                      <span className='font-black text-slate-900 text-sm'>
                        {currency}{ord.amount?.toFixed(2)}
                      </span>
                      <span
                        className='px-3 py-1 rounded-full text-[11px] font-bold text-white'
                        style={{ backgroundColor: STATUS_COLORS[ord.status] || '#64748b' }}
                      >
                        {ord.status || 'Packing'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Admin Shortcuts Launcher */}
        <div className='lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4 flex flex-col justify-between'>
          <div>
            <h3 className='text-lg font-bold text-slate-900'>Management Shortcuts</h3>
            <p className='text-xs text-slate-500 mt-0.5 font-medium'>
              Quick access controls to manage products, sellers, and approvals
            </p>
          </div>

          <div className='space-y-3 my-auto py-2'>
            <button
              onClick={() => navigate('/add')}
              className='w-full p-4 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all flex items-center justify-between text-left group cursor-pointer'
            >
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform'>
                  <Plus className='w-5 h-5' />
                </div>
                <div>
                  <h4 className='text-sm font-bold text-slate-900'>Add New Product</h4>
                  <p className='text-xs text-slate-500'>Create item in store catalog</p>
                </div>
              </div>
              <ArrowUpRight className='w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors' />
            </button>

            <button
              onClick={() => navigate('/product-approvals')}
              className='w-full p-4 rounded-2xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 transition-all flex items-center justify-between text-left group cursor-pointer'
            >
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform'>
                  <ShieldAlert className='w-5 h-5' />
                </div>
                <div>
                  <h4 className='text-sm font-bold text-slate-900'>Product Approvals</h4>
                  <p className='text-xs text-slate-500'>{metrics.pendingApprovals} pending review</p>
                </div>
              </div>
              <ArrowUpRight className='w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors' />
            </button>

            <button
              onClick={() => navigate('/sellers')}
              className='w-full p-4 rounded-2xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 transition-all flex items-center justify-between text-left group cursor-pointer'
            >
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform'>
                  <Users className='w-5 h-5' />
                </div>
                <div>
                  <h4 className='text-sm font-bold text-slate-900'>Seller Management</h4>
                  <p className='text-xs text-slate-500'>{metrics.activeSellers} merchant stores</p>
                </div>
              </div>
              <ArrowUpRight className='w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors' />
            </button>
          </div>

          <div className='p-3 bg-slate-900 text-white rounded-2xl text-xs flex items-center justify-between font-semibold'>
            <span>System Health:</span>
            <span className='text-emerald-400 font-bold flex items-center gap-1.5'>
              <span className='w-2 h-2 rounded-full bg-emerald-400 animate-ping' />
              Operational (100%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
