import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { Eye, ShoppingCart, TrendingUp, Package, RefreshCw, TrendingDown, Box, ArrowRight, Sparkles, AlertTriangle } from 'lucide-react';

const currency = '₹';
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

export const ProductAnalytics = ({ token, timeframe }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  const fetchAdvancedAnalytics = async () => {
    try {
      setLoading(true);
      
      const now = new Date();
      let startDate = new Date();
      let compStartDate = new Date();
      let compEndDate = new Date();
      
      if (timeframe === 'week') {
        startDate.setDate(now.getDate() - 7);
        compEndDate = new Date(startDate);
        compStartDate.setDate(compEndDate.getDate() - 7);
      } else if (timeframe === 'month') {
        startDate.setMonth(now.getMonth() - 1);
        compEndDate = new Date(startDate);
        compStartDate.setMonth(compEndDate.getMonth() - 1);
      } else {
        startDate = new Date(2020, 0, 1);
        compStartDate = null;
        compEndDate = null;
      }

      const params = new URLSearchParams({
        startDate: startDate.getTime(),
        endDate: now.getTime(),
      });

      if (compStartDate) {
        params.append('compStartDate', compStartDate.getTime());
        params.append('compEndDate', compEndDate.getTime());
      }

      const response = await axios.get(`${backendUrl}/api/seller/analytics/advanced?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setData(response.data);
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
      fetchAdvancedAnalytics();
    }
  }, [token, timeframe]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading advanced analytics...</p>
      </div>
    );
  }

  if (!data) return null;

  const { current, comparison, productPerformance, trends, compTrends } = data;

  const getChange = (curr, prev) => {
    if (!prev || prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  const totalProducts = productPerformance.length;
  // Compute some historical context for total products (assuming it's constant for now for sparkline)
  
  const currentConv = current.views > 0 ? (current.orders / current.views) * 100 : 0;
  const prevConv = comparison && comparison.views > 0 ? (comparison.orders / comparison.views) * 100 : 0;

  // Merged Chart Data
  const chartData = trends.map((t, i) => ({
    name: t.date,
    currentViews: t.views,
    compViews: (compTrends && compTrends[i]) ? compTrends[i].views : 0
  }));

  // Category Data
  const catData = {};
  productPerformance.forEach(p => {
     if (!catData[p.category]) catData[p.category] = 0;
     catData[p.category] += p.views;
  });
  const categoryChartData = Object.keys(catData).map(k => ({ name: k, value: catData[k] }));

  // Stock Data
  let inStock = 0; let lowStock = 0; let outOfStock = 0;
  productPerformance.forEach(p => {
     if (p.stock === 0) outOfStock++;
     else if (p.stock < 10) lowStock++;
     else inStock++;
  });
  const stockChartData = [
     { name: 'In Stock', value: inStock, color: '#10b981' },
     { name: 'Low Stock', value: lowStock, color: '#f59e0b' },
     { name: 'Out of Stock', value: outOfStock, color: '#ef4444' }
  ];

  // Performers
  const sortedByPerf = [...productPerformance].sort((a,b) => b.revenue - a.revenue);
  const topPerformers = sortedByPerf.slice(0, 6);
  const sortedByWorst = [...productPerformance].sort((a,b) => a.conversionRate - b.conversionRate).filter(p => p.views > 0);
  const lowPerformers = sortedByWorst.slice(0, 3);

  // Sparkline data mapping
  const viewSparkline = trends.map(t => ({ val: t.views }));
  const cartSparkline = trends.map(t => ({ val: t.carts }));
  const soldSparkline = trends.map(t => ({ val: t.unitsSold }));
  const convSparkline = trends.map(t => ({ val: t.views > 0 ? (t.carts/t.views)*100 : 0 }));
  const prodSparkline = trends.map(t => ({ val: totalProducts })); // static line

  return (
    <div className="space-y-6 animate-fade-in bg-slate-50/50 p-2 sm:p-4 rounded-3xl">
      
      {/* 1. KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard title="Total Products" value={totalProducts} change={0} sparklineData={prodSparkline} color="#8b5cf6" icon={<Box className="w-4 h-4" />} />
        <KPICard title="Products Sold" value={current.unitsSold} change={getChange(current.unitsSold, comparison?.unitsSold)} sparklineData={soldSparkline} color="#3b82f6" icon={<Package className="w-4 h-4" />} />
        <KPICard title="Product Views" value={current.views} change={getChange(current.views, comparison?.views)} sparklineData={viewSparkline} color="#f59e0b" icon={<Eye className="w-4 h-4" />} />
        <KPICard title="Add to Cart" value={current.carts} change={getChange(current.carts, comparison?.carts)} sparklineData={cartSparkline} color="#10b981" icon={<ShoppingCart className="w-4 h-4" />} />
        <KPICard title="Conversion Rate" value={`${currentConv.toFixed(2)}%`} change={getChange(currentConv, prevConv)} sparklineData={convSparkline} color="#ec4899" icon={<TrendingUp className="w-4 h-4" />} />
      </div>

      {/* 2. Middle Row: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200/60 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-slate-900">Product Views Over Time</h3>
            <div className="bg-slate-100 rounded-md px-3 py-1.5 text-xs font-semibold text-slate-600">Daily ▾</div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#94a3b8'}} dx={-10} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="currentViews" name="This Period" stroke="#8b5cf6" strokeWidth={3} dot={{r: 3, strokeWidth: 2}} activeDot={{r: 6}} />
                {compTrends && compTrends.length > 0 && (
                  <Line type="monotone" dataKey="compViews" name="Previous Period" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Views by Product Category</h3>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md cursor-pointer hover:bg-blue-100">View All</span>
          </div>
          <div className="flex-1 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryChartData} innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value">
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-slate-900">{current.views.toLocaleString()}</span>
              <span className="text-xs text-slate-500">Total Views</span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-y-2 gap-x-4">
            {categoryChartData.slice(0, 4).map((c, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                  <span className="text-slate-600 truncate max-w-[80px]">{c.name}</span>
                </div>
                <span className="font-semibold text-slate-900">{c.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Performing Products */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-slate-900">Top Performing Products</h3>
            <span className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer">View All</span>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-12 text-[10px] uppercase font-bold text-slate-400 mb-2 px-2">
              <div className="col-span-6">Product</div>
              <div className="col-span-2 text-center">Views</div>
              <div className="col-span-2 text-center">Sold</div>
              <div className="col-span-2 text-right">Conv. Rate</div>
            </div>
            {topPerformers.map((p, i) => (
              <div key={p.id} className="grid grid-cols-12 items-center px-2 py-2 hover:bg-slate-50 rounded-lg transition-colors">
                <div className="col-span-6 flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 w-3">{i+1}</span>
                  <img src={p.image} className="w-9 h-9 rounded-md object-cover border border-slate-200" alt="" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 line-clamp-1">{p.name}</p>
                    <p className="text-[10px] text-slate-500">{currency}{p.price}</p>
                  </div>
                </div>
                <div className="col-span-2 text-center">
                  <p className="text-xs font-semibold text-slate-700">{p.views}</p>
                </div>
                <div className="col-span-2 text-center">
                  <p className="text-xs font-semibold text-slate-700">{p.unitsSold}</p>
                </div>
                <div className="col-span-2 text-right">
                  <p className="text-xs font-bold text-emerald-600">{p.conversionRate.toFixed(2)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Funnel & Low Performers Column */}
        <div className="space-y-6 flex flex-col">
          
          {/* Funnel */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Performance by Funnel</h3>
                <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">?</div>
              </div>
              <span className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer">View Details</span>
            </div>
            
            <div className="space-y-5">
              <FunnelBar label="Product Views" value={current.views} total={current.views} color="bg-indigo-500" />
              <FunnelBar label="Add to Cart" value={current.carts} total={current.views} color="bg-indigo-400" />
              <FunnelBar label="Orders Placed" value={current.orders} total={current.views} color="bg-indigo-300" />
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">Overall Conversion Rate</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-slate-900">{currentConv.toFixed(2)}%</span>
                  <Badge change={getChange(currentConv, prevConv)} />
                </div>
              </div>
              <div className="w-32 h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={convSparkline}>
                    <Line type="monotone" dataKey="val" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Low Performers & Stock Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
            
            {/* Low Performing */}
            <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Low Performing</h3>
              <div className="space-y-3">
                {lowPerformers.map(p => (
                  <div key={p.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={p.image} className="w-7 h-7 rounded object-cover" alt=""/>
                      <p className="text-[11px] font-bold text-slate-700 line-clamp-1 w-24">{p.name}</p>
                    </div>
                    <span className="text-[11px] font-bold text-rose-500">{p.conversionRate.toFixed(2)}%</span>
                  </div>
                ))}
                {lowPerformers.length === 0 && <p className="text-xs text-slate-400 text-center py-4">All products performing well!</p>}
              </div>
            </div>

            {/* Stock Status */}
            <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-2">Stock Status</h3>
              <div className="flex items-center justify-center relative h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stockChartData} innerRadius={35} outerRadius={50} paddingAngle={3} dataKey="value">
                      {stockChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-sm font-bold text-slate-900">{totalProducts}</span>
                </div>
              </div>
              <div className="mt-2 space-y-1">
                {stockChartData.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{backgroundColor: s.color}}></div>
                      <span className="text-slate-600">{s.name}</span>
                    </div>
                    <span className="font-bold text-slate-800">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
      
      {/* 4. AI Insights Box */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-base font-bold text-slate-900">Product Analytics Insights</h3>
          <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded">AI</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl flex gap-3">
            <div className="mt-0.5"><TrendingUp className="w-4 h-4 text-emerald-500" /></div>
            <div>
              <p className="text-xs font-bold text-emerald-900">{topPerformers[0]?.name || 'Your top product'} is the top performer.</p>
              <p className="text-[11px] text-emerald-700 mt-1">Driving the highest conversion rate and revenue this period.</p>
            </div>
          </div>
          <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex gap-3">
            <div className="mt-0.5"><ShoppingCart className="w-4 h-4 text-blue-500" /></div>
            <div>
              <p className="text-xs font-bold text-blue-900">Add to cart rate is {current.views > 0 ? ((current.carts/current.views)*100).toFixed(1) : 0}%</p>
              <p className="text-[11px] text-blue-700 mt-1">Keep it up! This is a healthy engagement indicator.</p>
            </div>
          </div>
          <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-xl flex gap-3">
            <div className="mt-0.5"><AlertTriangle className="w-4 h-4 text-amber-500" /></div>
            <div>
              <p className="text-xs font-bold text-amber-900">{lowPerformers.length} products have low conversion.</p>
              <p className="text-[11px] text-amber-700 mt-1">Consider optimizing their images, descriptions, or pricing.</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

// Sub-components
const KPICard = ({ title, value, change, sparklineData, color, icon }) => {
  return (
    <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-500">{title}</span>
          <div className="w-6 h-6 rounded-md flex items-center justify-center opacity-80" style={{backgroundColor: `${color}15`, color: color}}>
            {icon}
          </div>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-xl font-extrabold text-slate-900">{typeof value === 'number' ? value.toLocaleString() : value}</span>
          <Badge change={change} />
        </div>
      </div>
      <div className="h-10 mt-3 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparklineData}>
            <Line type="monotone" dataKey="val" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const Badge = ({ change }) => {
  if (change === 0 || change === null) return null;
  const isPositive = change > 0;
  return (
    <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
      {isPositive ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
    </div>
  );
};

const FunnelBar = ({ label, value, total, color }) => {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-4">
      <div className="w-24 shrink-0">
        <p className="text-xs font-semibold text-slate-700">{label}</p>
        <p className="text-[10px] text-slate-500">{value.toLocaleString()}</p>
      </div>
      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }}></div>
      </div>
      <div className="w-10 text-right">
        <span className="text-xs font-bold text-slate-600">{pct.toFixed(1)}%</span>
      </div>
    </div>
  );
};
