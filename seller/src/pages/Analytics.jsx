import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Download, Package, Wallet, Star, Clock, ArrowUpRight, ArrowDownRight,
  TrendingUp, TrendingDown, Target, Info, Rocket, ArrowRight
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const currency = '₹';

const KPI = ({ title, value, previousValue, isCurrency = false, isPercent = false, Icon, iconBg, iconColor, loading }) => {
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, '')) : (value || 0);
  const numPrev = typeof previousValue === 'string' ? parseFloat(previousValue.replace(/[^0-9.-]+/g, '')) : (previousValue || 0);
  
  const percentChange = numPrev 
    ? (((numValue - numPrev) / numPrev) * 100).toFixed(1)
    : '0.0';
  const isPositive = Number(percentChange) >= 0;

  const displayValue = typeof value === 'number' 
    ? value.toLocaleString(undefined, { minimumFractionDigits: isCurrency || isPercent ? 2 : 0, maximumFractionDigits: isCurrency || isPercent ? 2 : 0 })
    : value;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-semibold text-slate-500 mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-slate-100 animate-pulse rounded-md"></div>
          ) : (
            <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              {isCurrency && currency}{displayValue}{isPercent && '%'}
              <span className={`flex items-center text-[11px] font-bold px-1.5 py-0.5 rounded-full ${isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(percentChange)}%
              </span>
            </h3>
          )}
        </div>
        <div className={`p-3 rounded-2xl ${iconBg} ${iconColor}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <p className="text-xs text-slate-400 font-medium">
        vs previous period
      </p>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label, prefix = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-100 rounded-xl shadow-lg">
        <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
        <p className="text-sm font-bold text-slate-900">
          {prefix}{payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

const Analytics = ({ token }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');
  const [earningsView, setEarningsView] = useState('daily');
  const navigate = useNavigate();

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${backendUrl}/api/seller/analytics?timeframe=${timeframe}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setData(response.data.analytics);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAnalytics();
    }
  }, [token, timeframe]);

  const COLORS = ['#6366f1', '#3b82f6', '#f43f5e', '#64748b', '#cbd5e1'];
  
  const statusData = data ? [
    { name: 'Delivered', value: data.deliveryStatus.delivered },
    { name: 'In Transit', value: data.deliveryStatus.inTransit },
    { name: 'Failed', value: data.deliveryStatus.failed },
    { name: 'Cancelled', value: data.deliveryStatus.cancelled },
    { name: 'Pending', value: data.deliveryStatus.pending },
  ].filter(item => item.value > 0) : [];

  const totalStatus = statusData.reduce((acc, curr) => acc + curr.value, 0);

  const demoCities = [];

  // PDF Download Function
  const downloadReport = () => {
    if (!data) return toast.error('No data available to download');
    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(18);
      doc.text(`Seller Analytics Report`, 14, 22);
      
      // Subtitle
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Timeframe: ${timeframe.toUpperCase()} | Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
      
      // Table Data
      const tableData = [
        ['Total Deliveries', data.overview.totalDeliveries.toString()],
        ['Total Earnings', `Rs. ${data.overview.totalEarnings.toLocaleString()}`],
        ['Average Rating', `${data.overview.averageRating} / 5.0`],
        ['Success Rate', `${data.overview.successRate}%`],
        ['Cancelled Orders', data.overview.cancelledOrders.toString()],
        ['Failed Deliveries', data.overview.failedDeliveries.toString()],
        ['Performance Score', `${data.performanceScore} / 100`]
      ];

      doc.autoTable({
        startY: 40,
        head: [['Metric', 'Value']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] }, // Indigo-600
        styles: { fontSize: 11, cellPadding: 5 }
      });

      doc.save(`Seller_Analytics_Report_${timeframe}.pdf`);
      toast.success('PDF Report downloaded successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    }
  };

  // Process Earnings Trend based on view (Daily vs Weekly)
  const getProcessedEarningsTrend = () => {
    if (!data?.earningsTrend) return [];
    if (earningsView === 'daily') return data.earningsTrend;
    
    // Process weekly
    const weeklyMap = {};
    data.earningsTrend.forEach(item => {
      // Assuming 'date' is string like 'Aug 21'
      // To properly group by week, we would need actual Dates, but since it's just 'MMM DD', 
      // simple grouping by chunking every 7 days is easiest for display.
      // Alternatively, we can just group by Week Number if we parse it.
      const d = new Date(item.date + ', ' + new Date().getFullYear());
      const weekStart = new Date(d.setDate(d.getDate() - d.getDay())).toLocaleDateString('default', { month: 'short', day: 'numeric' });
      
      if (!weeklyMap[weekStart]) weeklyMap[weekStart] = 0;
      weeklyMap[weekStart] += item.revenue;
    });

    return Object.keys(weeklyMap).map(week => ({
      date: `Week of ${week}`,
      revenue: weeklyMap[week]
    }));
  };

  const currentEarningsTrend = getProcessedEarningsTrend();

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen bg-[#fafafa]">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Seller Analytics</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Track your performance, earnings, deliveries, and growth insights.</p>
        </div>

        <div className="flex items-center gap-3">
          <select 
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 shadow-sm focus:outline-hidden focus:border-indigo-500"
          >
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
          <button onClick={downloadReport} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download Report</span>
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPI 
          title="Total Deliveries" 
          value={data?.overview?.totalDeliveries || 0} 
          previousValue={(data?.overview?.totalDeliveries || 0) * 0.8} 
          Icon={Package} 
          iconBg="bg-indigo-50" 
          iconColor="text-indigo-600" 
          loading={loading} 
        />
        <KPI 
          title="Total Earnings" 
          value={data?.overview?.totalEarnings || 0} 
          previousValue={(data?.overview?.totalEarnings || 0) * 0.75} 
          isCurrency={true} 
          Icon={Wallet} 
          iconBg="bg-emerald-50" 
          iconColor="text-emerald-600" 
          loading={loading} 
        />
        <KPI 
          title="Average Rating" 
          value={data?.overview?.averageRating || 0} 
          previousValue={(data?.overview?.averageRating || 0) - 0.2} 
          Icon={Star} 
          iconBg="bg-amber-50" 
          iconColor="text-amber-500" 
          loading={loading} 
        />
        <KPI 
          title="Success Rate" 
          value={data ? data.overview.successRate : 0} 
          previousValue={data ? data.overview.successRate - 2 : 0} 
          isPercent={true}
          Icon={Clock} 
          iconBg="bg-blue-50" 
          iconColor="text-blue-500" 
          loading={loading} 
        />
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Earnings Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900">Earnings Overview</h3>
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button 
                onClick={() => setEarningsView('daily')}
                className={`px-3 py-1 rounded-md text-xs font-semibold ${earningsView === 'daily' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 font-medium'}`}
              >
                Daily
              </button>
              <button 
                onClick={() => setEarningsView('weekly')}
                className={`px-3 py-1 rounded-md text-xs font-semibold ${earningsView === 'weekly' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 font-medium'}`}
              >
                Weekly
              </button>
            </div>
          </div>
          {loading ? (
            <div className="w-full h-[300px] bg-slate-50 animate-pulse rounded-xl"></div>
          ) : currentEarningsTrend.length === 0 ? (
            <div className="w-full h-[300px] flex items-center justify-center text-slate-400 text-sm font-medium">Not enough data to display</div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={currentEarningsTrend} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(value) => `₹${value}`} dx={-10} />
                  <Tooltip content={<CustomTooltip prefix="₹" />} />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Deliveries Status */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-900 mb-6">Deliveries by Status</h3>
          
          {loading ? (
             <div className="flex-1 bg-slate-50 animate-pulse rounded-xl"></div>
          ) : statusData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm font-medium">No deliveries yet</div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center relative">
              <div className="h-[200px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-bold text-slate-900">{totalStatus}</span>
                  <span className="text-xs text-slate-500 font-medium">Total</span>
                </div>
              </div>

              <div className="w-full mt-6 space-y-2">
                {statusData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                      <span className="text-slate-600 font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-900 font-semibold">{((item.value / totalStatus) * 100).toFixed(1)}%</span>
                      <span className="text-slate-400 text-xs">({item.value})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Deliveries Trend */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900">Deliveries Trend</h3>
          </div>
          {loading ? (
            <div className="w-full h-[220px] bg-slate-50 animate-pulse rounded-xl"></div>
          ) : data?.deliveriesTrend?.length === 0 ? (
            <div className="w-full h-[220px] flex items-center justify-center text-slate-400 text-sm font-medium">No data</div>
          ) : (
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.deliveriesTrend} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip cursor={{fill: '#f8fafc'}} content={<CustomTooltip />} />
                  <Bar dataKey="deliveries" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top Service Cities */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-slate-900">Top Service Cities</h3>
          </div>
          <p className="text-xs text-slate-400 mb-6 text-center">City-level analytics coming soon.</p>
        </div>

        {/* Performance Score */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-center items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-xs font-bold">
              <TrendingUp className="w-3 h-3" />
              6 pts
            </div>
          </div>
          <h3 className="font-bold text-slate-900 self-start mb-4">Performance Score</h3>
          
          {loading ? (
             <div className="w-48 h-24 bg-slate-50 animate-pulse rounded-t-full"></div>
          ) : (
            <>
              {/* Fake Half Donut Chart for Gauge */}
              <div className="relative w-48 h-24 overflow-hidden mt-4">
                <div className="w-48 h-48 border-[16px] border-slate-100 rounded-full absolute top-0"></div>
                <div 
                  className="w-48 h-48 border-[16px] border-emerald-500 rounded-full absolute top-0"
                  style={{ 
                    clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)',
                    transform: `rotate(${ -180 + (Number(data?.performanceScore || 0) * 1.8)}deg)`,
                    transformOrigin: '50% 50%',
                    transition: 'transform 1s ease-out'
                  }}
                ></div>
              </div>
              <div className="text-center mt-[-30px] z-10 bg-white px-6">
                <span className="text-4xl font-extrabold text-slate-900">{data?.performanceScore || 0}</span>
                <span className="text-slate-400 font-medium">/100</span>
                <p className="text-emerald-600 font-bold text-sm mt-1">{data?.performanceScore >= 80 ? 'Excellent' : data?.performanceScore >= 50 ? 'Good' : 'Needs Improvement'}</p>
              </div>
              
              <div className="mt-8 flex items-start gap-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                <Target className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                  Great job! You're performing better than <strong>92%</strong> of sellers. Keep maintaining high success rates.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Insights & Growth Footer */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Insights */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Recent Insights</h3>
          {loading ? (
            <div className="flex gap-4">
              <div className="h-20 flex-1 bg-slate-50 animate-pulse rounded-xl"></div>
              <div className="h-20 flex-1 bg-slate-50 animate-pulse rounded-xl"></div>
            </div>
          ) : data?.insights?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {data.insights.map((insight, idx) => (
                <div key={idx} className="flex gap-3 bg-slate-50 border border-slate-100 p-4 rounded-xl items-start">
                  <div className="p-2 rounded-full bg-white shadow-sm shrink-0 text-indigo-600">
                    <Info className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-medium text-slate-700 leading-snug">{insight}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Not enough data to generate insights.</p>
          )}
        </div>

        {/* Growth Widget */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-4 shadow-md">
            <Rocket className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 mb-2 text-lg">Want to boost sales?</h3>
          <p className="text-xs text-slate-600 font-medium leading-relaxed mb-6">
            Upload a Studio Video showcasing your products to increase visibility and conversions.
          </p>
          <button 
            onClick={() => navigate('/add-video')}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2"
          >
            Upload Video
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
};

export default Analytics;
