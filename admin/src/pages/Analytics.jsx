import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { backendUrl, currency } from '../App';
import { toast } from 'react-toastify';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, BarChart, Bar, Legend 
} from 'recharts';
import { 
    TrendingUp, TrendingDown, IndianRupee, ShoppingBag, 
    BarChart3, Users, Target, ChevronDown, Calendar, 
    Clock, ArrowUpRight, Activity, ArrowRight, Wallet, ShoppingCart
} from 'lucide-react';

const Analytics = ({ token }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await axios.get(backendUrl + '/api/order/admin-analytics', { headers: { token } });
                if (response.data.success) {
                    setData(response.data.analytics);
                } else {
                    toast.error(response.data.message);
                }
            } catch (error) {
                toast.error(error.message);
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchAnalytics();
    }, [token]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[70vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!data) return null;

    // Custom Tooltip for Line Chart
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 shadow-lg border border-slate-100 rounded-lg">
                    <p className="text-sm font-semibold text-slate-800">{label}</p>
                    <p className="text-sm text-indigo-600 font-medium">
                        Revenue: {currency}{payload[0].value.toLocaleString()}
                    </p>
                </div>
            );
        }
        return null;
    };

    // Card Component
    const KPICard = ({ title, value, growth, icon: Icon, iconColor, sparklineData }) => (
        <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between group hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <p className="text-[13px] font-medium text-slate-500 mb-1">{title}</p>
                    <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
                </div>
                <div className={`p-2.5 rounded-xl ${iconColor}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            
            <div className="flex items-center gap-2 mt-2">
                {parseFloat(growth) >= 0 ? (
                    <div className="flex items-center text-xs font-bold text-emerald-600">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {growth}%
                    </div>
                ) : (
                    <div className="flex items-center text-xs font-bold text-red-500">
                        <TrendingDown className="w-3 h-3 mr-1" />
                        {Math.abs(growth)}%
                    </div>
                )}
                <span className="text-[11px] text-slate-400">vs Last Week</span>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-10">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
                    <p className="text-sm text-slate-500">Track your store performance and make data-driven decisions.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-slate-50">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        This Week vs Last Week
                        <ChevronDown className="w-4 h-4 ml-2 text-slate-400" />
                    </button>
                    <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-slate-50">
                        Download Report
                    </button>
                </div>
            </div>

            {/* Tabs (Static for UI likeness) */}
            <div className="flex gap-6 border-b border-slate-200 text-sm font-medium text-slate-500 overflow-x-auto hide-scrollbar">
                <button className="text-indigo-600 border-b-2 border-indigo-600 pb-3 px-1 whitespace-nowrap">Overview</button>
                <button className="hover:text-slate-800 pb-3 px-1 whitespace-nowrap">Sales Analysis</button>
                <button className="hover:text-slate-800 pb-3 px-1 whitespace-nowrap">Orders Analysis</button>
                <button className="hover:text-slate-800 pb-3 px-1 whitespace-nowrap">Product Analysis</button>
                <button className="hover:text-slate-800 pb-3 px-1 whitespace-nowrap">Customer Analysis</button>
                <button className="hover:text-slate-800 pb-3 px-1 whitespace-nowrap">Traffic Analysis</button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <KPICard 
                    title="Total Revenue" 
                    value={`${currency}${data.totalRevenue.toLocaleString()}`} 
                    growth={data.revenueGrowth} 
                    icon={IndianRupee} 
                    iconColor="bg-blue-50 text-blue-600"
                />
                <KPICard 
                    title="Total Orders" 
                    value={data.totalOrders.toLocaleString()} 
                    growth={data.ordersGrowth} 
                    icon={ShoppingBag} 
                    iconColor="bg-emerald-50 text-emerald-600"
                />
                <KPICard 
                    title="Average Order Value" 
                    value={`${currency}${data.averageOrderValue.toLocaleString()}`} 
                    growth={data.revenueGrowth} // Approximated
                    icon={BarChart3} 
                    iconColor="bg-purple-50 text-purple-600"
                />
                <KPICard 
                    title="Total Customers" 
                    value={data.totalCustomers.toLocaleString()} 
                    growth="14.2" // Static for demo 
                    icon={Users} 
                    iconColor="bg-orange-50 text-orange-600"
                />
                <KPICard 
                    title="Conversion Rate" 
                    value={`${data.conversionRate}%`} 
                    growth="0.8" // Static for demo
                    icon={Target} 
                    iconColor="bg-teal-50 text-teal-600"
                />
            </div>

            {/* Charts Section 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Revenue Overview Line Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.03)] border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-base font-bold text-slate-800">Revenue Overview</h3>
                            <p className="text-2xl font-bold text-slate-900 mt-1">{currency}{data.thisWeekRevenue.toLocaleString()}</p>
                        </div>
                        <button className="text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1">
                            Daily <ChevronDown className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.dailyRevenue} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(val) => `${currency}${val / 1000}k`} />
                                <RechartsTooltip content={<CustomTooltip />} />
                                <Line type="monotone" dataKey="thisWeekSales" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="lastWeekSales" stroke="#cbd5e1" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Revenue Breakdown Donut Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.03)] border border-slate-100">
                    <h3 className="text-base font-bold text-slate-800 mb-6">Revenue Breakdown</h3>
                    <div className="h-[200px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.revenueBreakdown}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {data.revenueBreakdown.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip formatter={(value) => `${currency}${value.toLocaleString()}`} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-sm font-semibold text-slate-800">{currency}{data.totalRevenue.toLocaleString()}</span>
                            <span className="text-[10px] text-slate-500">Total</span>
                        </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-2 gap-y-3">
                        {data.revenueBreakdown.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                                <div className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ backgroundColor: item.color }}></div>
                                <div>
                                    <p className="text-xs font-medium text-slate-700">{item.name}</p>
                                    <p className="text-[11px] text-slate-500">{currency}{item.value.toLocaleString()} ({(item.value/data.totalRevenue * 100).toFixed(1)}%)</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Charts Section 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Sales Trend Comparison Bar Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.03)] border border-slate-100">
                    <h3 className="text-base font-bold text-slate-800 mb-6">Sales Trend Comparison</h3>
                    <div className="flex gap-4 text-xs mb-4">
                        <div className="flex items-center gap-1.5 text-indigo-600 font-medium">
                            <div className="w-3 h-3 bg-indigo-500 rounded-sm"></div> This Week
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                            <div className="w-3 h-3 bg-slate-200 rounded-sm"></div> Last Week
                        </div>
                    </div>
                    <div className="h-[220px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.dailyRevenue} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(val) => `${val/1000}k`} />
                                <RechartsTooltip cursor={{fill: 'transparent'}} formatter={(value) => `${currency}${value}`} />
                                <Bar dataKey="lastWeekSales" fill="#e2e8f0" radius={[2, 2, 0, 0]} barSize={12} />
                                <Bar dataKey="thisWeekSales" fill="#4f46e5" radius={[2, 2, 0, 0]} barSize={12} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Orders by Payment Method */}
                <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.03)] border border-slate-100">
                    <h3 className="text-base font-bold text-slate-800 mb-6">Orders by Payment Method</h3>
                    <div className="h-[180px] w-full relative mb-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.paymentData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {data.paymentData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-lg font-bold text-slate-800">{data.totalOrders}</span>
                            <span className="text-[10px] text-slate-500">Orders</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {data.paymentData.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                                    <span className="text-sm font-medium text-slate-700">{item.name}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-semibold text-slate-800">{((item.value/data.totalOrders)*100 || 0).toFixed(1)}%</span>
                                    <span className="text-xs text-slate-400 ml-1">({item.value})</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Performing Categories */}
                <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.03)] border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-base font-bold text-slate-800">Top Categories</h3>
                        <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">View All</button>
                    </div>
                    
                    <div className="space-y-5">
                        {data.topCategories.map((cat, idx) => {
                            const percentage = ((cat.value / data.totalRevenue) * 100).toFixed(1);
                            // Colors for progress bars
                            const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500', 'bg-teal-500'];
                            const bgColor = colors[idx % colors.length];

                            return (
                                <div key={idx}>
                                    <div className="flex justify-between items-end mb-1.5">
                                        <span className="text-sm font-medium text-slate-700">{cat.name}</span>
                                        <div className="text-right">
                                            <span className="text-sm font-semibold text-slate-900 mr-2">{currency}{cat.value.toLocaleString()}</span>
                                            <span className="text-xs text-slate-500">{percentage}%</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                                        <div className={`${bgColor} h-1.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Insights & Recommendations */}
            <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-slate-400" /> Insights & Recommendations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Insight 1 */}
                    <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl flex items-start gap-3">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg shrink-0">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-emerald-900 mb-1">Revenue is up!</h4>
                            <p className="text-xs text-emerald-700/80 leading-relaxed">
                                Your revenue increased by {data.revenueGrowth}% compared to last week. Great job!
                            </p>
                        </div>
                    </div>

                    {/* Insight 2 */}
                    <div className="bg-orange-50/50 border border-orange-100 p-4 rounded-xl flex items-start gap-3">
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg shrink-0">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-orange-900 mb-1">Peak Sales Time</h4>
                            <p className="text-xs text-orange-700/80 leading-relaxed">
                                You get most orders between 7 PM - 10 PM. Optimize your promotions during this window!
                            </p>
                        </div>
                    </div>

                    {/* Insight 3 */}
                    <div className="bg-purple-50/50 border border-purple-100 p-4 rounded-xl flex items-start gap-3">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg shrink-0">
                            <Target className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-purple-900 mb-1">Improve Conversion</h4>
                            <p className="text-xs text-purple-700/80 leading-relaxed">
                                Your store conversion rate is {data.conversionRate}%. Consider optimizing product pages to push it above 4%.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Analytics;
