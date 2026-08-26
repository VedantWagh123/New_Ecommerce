import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  ShoppingBag, 
  Wallet, 
  BarChart2, 
  Users, 
  Clock, 
  ChevronDown,
  Calendar
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

const currency = '₹'; // Assuming INR as per template image (2,48,360)

const Dashboard = ({ token, searchQuery }) => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalProducts: 0,
    activeProducts: 0,
    pendingOrders: 0,
    totalSales: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [charts, setCharts] = useState({ salesTrend: [], statusDistribution: {} });
  
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${backendUrl}/api/seller/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSummary(response.data.summary);
        setRecentOrders(response.data.recentOrders || []);
        setTopProducts(response.data.topProducts || []);
        setCategoryData(response.data.categoryData || []);
        if (response.data.charts) {
          setCharts(response.data.charts);
        }
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  // Derived Real Data
  const totalOrdersCount = summary.totalOrdersCount || 0; 
  const totalRevenue = summary.totalSales || 0;
  const avgOrderValue = totalOrdersCount ? Math.round(totalRevenue / totalOrdersCount) : 0;
  const totalCustomers = summary.totalCustomers || 0;
  const pendingOrdersCount = summary.pendingOrders || 0;

  // Real Category Data for Donut Chart
  const totalCategories = categoryData.reduce((acc, curr) => acc + curr.value, 0);
  const formattedCategoryData = categoryData.map((cat, i) => {
    const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#ec4899'];
    const percent = totalCategories > 0 ? ((cat.value / totalCategories) * 100).toFixed(1) + '%' : '0%';
    return { ...cat, color: colors[i % colors.length], percent };
  });

  // Mock Sparklines
  const generateSparkline = (base, variance) => {
    return Array.from({ length: 7 }, (_, i) => ({
      value: base + Math.random() * variance - (variance/2)
    }));
  };

  // Orders Overview Line Chart Data (This week vs Last week)
  const overviewData = [
    { name: '18 May', thisWeek: 180, lastWeek: 90 },
    { name: '19 May', thisWeek: 250, lastWeek: 140 },
    { name: '20 May', thisWeek: 240, lastWeek: 220 },
    { name: '21 May', thisWeek: 230, lastWeek: 130 },
    { name: '22 May', thisWeek: 300, lastWeek: 200 },
    { name: '23 May', thisWeek: 210, lastWeek: 130 },
    { name: '24 May', thisWeek: 320, lastWeek: 280 },
  ];

  // Order Status Donut Chart
  const statusColors = {
    'Delivered': '#22c55e', // Green
    'Shipped': '#3b82f6',   // Blue
    'Processing': '#a855f7',// Purple
    'Pending': '#f59e0b'    // Orange
  };

  const statusData = [
    { name: 'Delivered', value: charts.statusDistribution?.['Delivered'] || 685, color: statusColors['Delivered'], percent: '54.9%' },
    { name: 'Shipped', value: charts.statusDistribution?.['Shipped'] || 276, color: statusColors['Shipped'], percent: '22.1%' },
    { name: 'Processing', value: charts.statusDistribution?.['Packing'] || 178, color: statusColors['Processing'], percent: '14.3%' },
    { name: 'Pending', value: charts.statusDistribution?.['Placed'] || 109, color: statusColors['Pending'], percent: '8.7%' },
  ];

  const totalStatus = statusData.reduce((acc, curr) => acc + curr.value, 0);

  // Map real recent orders
  const displayOrders = recentOrders.length > 0 ? recentOrders : [];

  const getStatusStyle = (status) => {
    switch(status?.toLowerCase()) {
      case 'delivered': return 'bg-[#e0f7e9] text-[#16a34a]';
      case 'shipped': return 'bg-[#e0f2fe] text-[#2563eb]';
      case 'processing': 
      case 'packing': return 'bg-[#f3e8ff] text-[#9333ea]';
      case 'pending':
      case 'placed': return 'bg-[#fef3c7] text-[#d97706]';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusText = (status) => {
    if (status?.toLowerCase() === 'packing' || status?.toLowerCase() === 'placed') return 'Processing';
    return status;
  }

  return (
    <div className="p-6 bg-[#f8f9fc] min-h-screen text-[#1e293b] font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome back, Fashion Hub! Here's what's happening with your store.</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 shadow-sm cursor-pointer hover:bg-gray-50">
          <Calendar className="w-4 h-4 mr-2 text-gray-500" />
          May 18 – May 24, 2025
          <ChevronDown className="w-4 h-4 ml-3 text-gray-400" />
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* Card 1: Total Orders */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Total Orders</p>
              <h3 className="text-2xl font-bold text-gray-900">{totalOrdersCount.toLocaleString()}</h3>
              <p className="text-[11px] font-semibold text-emerald-500 mt-1 flex items-center">
                ↑ 18.5% <span className="text-gray-400 font-normal ml-1">vs last week</span>
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="h-10 w-full absolute bottom-0 left-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={generateSparkline(100, 20)}>
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2: Total Revenue */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Total Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900">{currency}{totalRevenue.toLocaleString()}</h3>
              <p className="text-[11px] font-semibold text-emerald-500 mt-1 flex items-center">
                ↑ 22.7% <span className="text-gray-400 font-normal ml-1">vs last week</span>
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="h-10 w-full absolute bottom-0 left-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={generateSparkline(100, 20)}>
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 3: Avg Order Value */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Average Order Value</p>
              <h3 className="text-2xl font-bold text-gray-900">{currency}{avgOrderValue.toLocaleString()}</h3>
              <p className="text-[11px] font-semibold text-emerald-500 mt-1 flex items-center">
                ↑ 6.3% <span className="text-gray-400 font-normal ml-1">vs last week</span>
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-500 flex items-center justify-center">
              <BarChart2 className="w-4 h-4" />
            </div>
          </div>
          <div className="h-10 w-full absolute bottom-0 left-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={generateSparkline(100, 20)}>
                <Line type="monotone" dataKey="value" stroke="#a855f7" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 4: Total Customers */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Total Customers</p>
              <h3 className="text-2xl font-bold text-gray-900">{totalCustomers.toLocaleString()}</h3>
              <p className="text-[11px] font-semibold text-emerald-500 mt-1 flex items-center">
                ↑ 14.2% <span className="text-gray-400 font-normal ml-1">vs last week</span>
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="h-10 w-full absolute bottom-0 left-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={generateSparkline(100, 20)}>
                <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 5: Pending Orders */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Pending Orders</p>
              <h3 className="text-2xl font-bold text-gray-900">{pendingOrdersCount.toLocaleString()}</h3>
              <p className="text-[11px] font-semibold text-red-500 mt-1 flex items-center">
                ↓ 5.6% <span className="text-gray-400 font-normal ml-1">vs last week</span>
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="h-10 w-full absolute bottom-0 left-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={generateSparkline(100, 20)}>
                <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Orders Overview Line Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-gray-900">Orders Overview</h2>
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs font-medium text-gray-600 cursor-pointer">
              Orders <ChevronDown className="w-3 h-3 ml-2" />
            </div>
          </div>
          <div className="flex items-center gap-6 mb-4 text-xs font-medium pl-4">
            <div className="flex items-center gap-2"><div className="w-3 h-1 bg-blue-500 rounded"></div> <span className="text-gray-700">This Week</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-1 bg-gray-300 rounded"></div> <span className="text-gray-500">Last Week</span></div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={overviewData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '8px' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                />
                <Line type="monotone" dataKey="thisWeek" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="lastWeek" stroke="#cbd5e1" strokeWidth={2} dot={{ r: 4, fill: '#cbd5e1', strokeWidth: 2, stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Donut */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-gray-900">Order Status</h2>
            <div className="flex items-center text-xs font-medium text-gray-500 cursor-pointer">
              This Week <ChevronDown className="w-3 h-3 ml-1" />
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div className="h-48 w-full relative mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                <span className="text-xl font-bold text-gray-900">{totalStatus.toLocaleString()}</span>
                <span className="text-[10px] font-medium text-gray-400">Total</span>
              </div>
            </div>
            
            {/* Custom Legend */}
            <div className="flex flex-col gap-2.5 px-4">
              {statusData.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-gray-700 font-medium">{item.name}</span>
                  </div>
                  <div className="text-gray-900 font-semibold">
                    {item.value.toLocaleString()} <span className="text-gray-400 ml-1 font-normal">({item.percent})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Selling Products */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-gray-900">Top Selling Products</h2>
            <button className="text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1 rounded hover:bg-gray-100">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-gray-500 font-semibold border-b border-gray-100">
                <tr>
                  <th className="pb-3 pr-2">Product</th>
                  <th className="pb-3 px-2 text-center">Units Sold</th>
                  <th className="pb-3 pl-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 font-medium">
                {topProducts.map((p, i) => (
                  <tr key={p.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 pr-2 flex items-center gap-3">
                      <span className="text-gray-400 w-3">{i+1}</span>
                      <img src={Array.isArray(p.img) ? p.img[0] : (p.img || 'https://via.placeholder.com/100')} alt="product" className="w-8 h-8 rounded bg-gray-100 object-cover" />
                      <span className="truncate max-w-[120px]">{p.name}</span>
                    </td>
                    <td className="py-3 px-2 text-center">{p.sold}</td>
                    <td className="py-3 pl-2 text-right font-semibold text-gray-900">{currency}{p.rev.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sales by Category */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-gray-900">Sales by Category</h2>
            <button className="text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1 rounded hover:bg-gray-100">View All</button>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div className="h-44 w-full relative mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={formattedCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {formattedCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                <span className="text-lg font-bold text-gray-900">{currency}{totalCategories.toLocaleString()}</span>
                <span className="text-[10px] font-medium text-gray-400">Total</span>
              </div>
            </div>
            
            <div className="flex justify-center flex-wrap gap-4 text-[10px] md:text-xs">
              {formattedCategoryData.map((item, i) => (
                <div key={i} className="flex flex-col items-center text-center gap-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-gray-600 font-medium">{item.name}</span>
                  </div>
                  <div className="font-semibold text-gray-900">
                    {item.value} <span className="text-gray-400 font-normal">({item.percent})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Orders List */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-gray-900">Recent Orders</h2>
            <button className="text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1 rounded hover:bg-gray-100">View All</button>
          </div>
          
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
            {displayOrders.map((order, i) => (
              <div key={order._id || i} className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-blue-600 hover:underline cursor-pointer mb-0.5">#ORD{order.orderId}</p>
                  <p className="text-[10px] text-gray-400">
                    {new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} | {order.time || '10:00 AM'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-xs font-bold text-gray-900">{currency}{order.amount.toLocaleString()}</p>
                  <div className={`px-2 py-1 rounded text-[10px] font-bold w-20 text-center uppercase tracking-wide ${getStatusStyle(order.status)}`}>
                    {getStatusText(order.status)}
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-300 -rotate-90 cursor-pointer" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
