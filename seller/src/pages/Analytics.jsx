import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BarChart3, TrendingUp, ShoppingBag, DollarSign, Package, Filter, Award } from 'lucide-react';

const currency = '$';

const Analytics = ({ token }) => {
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalUnitsSold: 0,
    totalOrders: 0,
    topProducts: []
  });
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('all');

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${backendUrl}/api/seller/analytics?timeframe=${timeframe}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setAnalytics(response.data.analytics);
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
      fetchAnalytics();
    }
  }, [token, timeframe]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sales Analytics & Insights</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Analyze your apparel sales velocity, top performing products, and gross revenue.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-2xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-hidden cursor-pointer"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Delivered Revenue</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <span className="text-3xl font-extrabold text-slate-900">{currency}{analytics.totalRevenue.toLocaleString()}</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Units Sold</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <span className="text-3xl font-extrabold text-slate-900">{analytics.totalUnitsSold}</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Orders Processed</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <span className="text-3xl font-extrabold text-slate-900">{analytics.totalOrders}</span>
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-6">
          <Award className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-bold text-slate-900">Top Performing Products</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading sales analytics...</div>
        ) : analytics.topProducts.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No product sales recorded yet.</div>
        ) : (
          <div className="space-y-4">
            {analytics.topProducts.map((product, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                    #{idx + 1}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{product.name}</h4>
                    <span className="text-[11px] text-slate-500">{product.unitsSold} units sold</span>
                  </div>
                </div>
                <div className="text-right font-bold text-slate-900 text-sm">
                  {currency}{product.revenue}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
