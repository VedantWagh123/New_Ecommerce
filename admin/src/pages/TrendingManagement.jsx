import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Flame,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  Slash,
  Trash2,
  Settings,
  Search,
  RefreshCw,
  SlidersHorizontal,
  Store,
  Tag,
  AlertTriangle,
  X
} from 'lucide-react';
import { backendUrl, currency } from '../App';

const TrendingManagement = ({ token }) => {
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ active: 0, scheduled: 0, pending: 0, expired: 0, removed: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modals state
  const [configModalProduct, setConfigModalProduct] = useState(null);
  const [removeModalProduct, setRemoveModalProduct] = useState(null);
  const [deleteModalProduct, setDeleteModalProduct] = useState(null);

  // Form state inside configuration modal
  const [formEnabled, setFormEnabled] = useState(true);
  const [formDurationPreset, setFormDurationPreset] = useState('7d');
  const [formCustomStart, setFormCustomStart] = useState('');
  const [formCustomEnd, setFormCustomEnd] = useState('');
  const [formPriority, setFormPriority] = useState(1);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchTrendingData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${backendUrl}/api/trending/admin/list`, {
        params: { statusFilter, search },
        headers: { token }
      });

      if (res.data.success) {
        setProducts(res.data.products || []);
        setStats(res.data.stats || { active: 0, scheduled: 0, pending: 0, expired: 0, removed: 0, total: 0 });
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load trending management data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTrendingData();
    }
  }, [token, statusFilter, search]);

  const openConfigModal = (prod) => {
    setConfigModalProduct(prod);
    setFormEnabled(prod.trending?.enabled !== false);
    setFormDurationPreset('7d');
    setFormPriority(prod.trending?.priority || 1);

    const now = new Date();
    const startIso = prod.trending?.startAt ? new Date(prod.trending.startAt).toISOString().slice(0, 16) : new Date(now).toISOString().slice(0, 16);
    const endIso = prod.trending?.endAt ? new Date(prod.trending.endAt).toISOString().slice(0, 16) : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

    setFormCustomStart(startIso);
    setFormCustomEnd(endIso);
    setRejectionReason('');
  };

  const handleSaveConfig = async (action = 'CONFIGURE') => {
    if (!configModalProduct) return;

    try {
      const payload = {
        productId: configModalProduct._id,
        action,
        enabled: formEnabled,
        durationPreset: formDurationPreset,
        customStartAt: formCustomStart ? new Date(formCustomStart).toISOString() : null,
        customEndAt: formCustomEnd ? new Date(formCustomEnd).toISOString() : null,
        priority: Number(formPriority) || 1,
        rejectionReason
      };

      const res = await axios.post(`${backendUrl}/api/trending/admin/configure`, payload, {
        headers: { token }
      });

      if (res.data.success) {
        toast.success(res.data.message);
        setConfigModalProduct(null);
        fetchTrendingData();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save trending configuration');
    }
  };

  const handleRemoveTrending = async () => {
    if (!removeModalProduct) return;
    try {
      const res = await axios.post(
        `${backendUrl}/api/trending/admin/remove`,
        { productId: removeModalProduct._id },
        { headers: { token } }
      );

      if (res.data.success) {
        toast.success(res.data.message);
        setRemoveModalProduct(null);
        fetchTrendingData();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove from trending');
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteModalProduct) return;
    try {
      const res = await axios.post(
        `${backendUrl}/api/trending/admin/delete-product`,
        { productId: deleteModalProduct._id },
        { headers: { token } }
      );

      if (res.data.success) {
        toast.success(res.data.message);
        setDeleteModalProduct(null);
        fetchTrendingData();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete product');
    }
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return 'N/A';
    return new Date(dateVal).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <span className='px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 w-max'><Flame className='w-3.5 h-3.5 text-emerald-600 animate-pulse' /> Active Trending</span>;
      case 'SCHEDULED':
        return <span className='px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1 w-max'><Calendar className='w-3.5 h-3.5 text-blue-600' /> Scheduled</span>;
      case 'PENDING':
        return <span className='px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 w-max'><Clock className='w-3.5 h-3.5 text-amber-600 animate-spin' /> Pending Request</span>;
      case 'EXPIRED':
        return <span className='px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1 w-max'><Clock className='w-3.5 h-3.5 text-slate-500' /> Expired</span>;
      case 'REJECTED':
        return <span className='px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 w-max'><XCircle className='w-3.5 h-3.5 text-rose-600' /> Rejected</span>;
      case 'REMOVED':
        return <span className='px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-300 flex items-center gap-1 w-max'><Slash className='w-3.5 h-3.5 text-gray-500' /> Removed</span>;
      default:
        return <span className='px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200'>Not Trending</span>;
    }
  };

  return (
    <div className='space-y-6 max-w-7xl mx-auto'>
      {/* Header */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs'>
        <div>
          <div className='flex items-center gap-2'>
            <span className='p-2.5 rounded-2xl bg-orange-500/10 text-orange-600 border border-orange-500/20'>
              <Flame className='w-6 h-6' />
            </span>
            <div>
              <h1 className='text-xl font-bold text-slate-900'>Trending Products Management</h1>
              <p className='text-xs text-slate-500'>
                Admin authority to control homepage trending products, durations, priority & requests.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchTrendingData}
          className='flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors self-start md:self-auto cursor-pointer'
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4'>
        <div className='bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 rounded-2xl border border-emerald-200/80 shadow-2xs'>
          <p className='text-xs font-semibold text-emerald-800 flex items-center gap-1.5'>
            <Flame className='w-4 h-4 text-emerald-600' /> Active Trending
          </p>
          <p className='text-2xl font-black text-emerald-950 mt-2'>{stats.active}</p>
        </div>

        <div className='bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 rounded-2xl border border-blue-200/80 shadow-2xs'>
          <p className='text-xs font-semibold text-blue-800 flex items-center gap-1.5'>
            <Calendar className='w-4 h-4 text-blue-600' /> Scheduled
          </p>
          <p className='text-2xl font-black text-blue-950 mt-2'>{stats.scheduled}</p>
        </div>

        <div className='bg-gradient-to-br from-amber-50 to-amber-100/50 p-4 rounded-2xl border border-amber-200/80 shadow-2xs'>
          <p className='text-xs font-semibold text-amber-900 flex items-center gap-1.5'>
            <Clock className='w-4 h-4 text-amber-600' /> Pending Requests
          </p>
          <p className='text-2xl font-black text-amber-950 mt-2'>{stats.pending}</p>
        </div>

        <div className='bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-2xl border border-slate-200/80 shadow-2xs'>
          <p className='text-xs font-semibold text-slate-700 flex items-center gap-1.5'>
            <Clock className='w-4 h-4 text-slate-500' /> Expired
          </p>
          <p className='text-2xl font-black text-slate-900 mt-2'>{stats.expired}</p>
        </div>

        <div className='bg-gradient-to-br from-purple-50 to-purple-100/50 p-4 rounded-2xl border border-purple-200/80 shadow-2xs col-span-2 sm:col-span-1'>
          <p className='text-xs font-semibold text-purple-800 flex items-center gap-1.5'>
            <Tag className='w-4 h-4 text-purple-600' /> Total Store Products
          </p>
          <p className='text-2xl font-black text-purple-950 mt-2'>{stats.total}</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className='bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4'>
        <div className='flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4'>
          {/* Status Tabs */}
          <div className='flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none'>
            {[
              { id: 'ALL', label: 'All Products' },
              { id: 'ACTIVE', label: `Active (${stats.active})` },
              { id: 'SCHEDULED', label: `Scheduled (${stats.scheduled})` },
              { id: 'PENDING', label: `Pending Requests (${stats.pending})` },
              { id: 'EXPIRED', label: `Expired (${stats.expired})` },
              { id: 'REMOVED', label: `Removed (${stats.removed})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className='relative w-full md:w-64 shrink-0'>
            <Search className='w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400' />
            <input
              type='text'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search by name or category...'
              className='w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
            />
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className='bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full text-left text-xs border-collapse'>
            <thead>
              <tr className='bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold'>
                <th className='py-3.5 px-4'>Product</th>
                <th className='py-3.5 px-4'>Seller / Store</th>
                <th className='py-3.5 px-4'>Status</th>
                <th className='py-3.5 px-4'>Priority</th>
                <th className='py-3.5 px-4'>Start Date</th>
                <th className='py-3.5 px-4'>End Date</th>
                <th className='py-3.5 px-4 text-right'>Admin Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-100 font-medium text-slate-700'>
              {loading ? (
                <tr>
                  <td colSpan='7' className='py-12 text-center text-slate-400 font-medium'>
                    <RefreshCw className='w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500' />
                    Loading Trending Catalog Data...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan='7' className='py-12 text-center text-slate-400 font-medium'>
                    No products found matching the criteria.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p._id} className='hover:bg-slate-50/60 transition-colors'>
                    {/* Product Name & Image */}
                    <td className='py-3.5 px-4'>
                      <div className='flex items-center gap-3 min-w-[200px]'>
                        <img
                          src={Array.isArray(p.image) ? p.image[0] : p.image}
                          alt={p.name}
                          className='w-11 h-11 object-cover rounded-xl border border-slate-200 bg-slate-100 shrink-0'
                        />
                        <div className='overflow-hidden'>
                          <p className='font-bold text-slate-900 truncate max-w-[180px]'>{p.name}</p>
                          <p className='text-[11px] text-slate-500 font-medium'>
                            {currency}{p.price} • {p.category}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Seller / Store */}
                    <td className='py-3.5 px-4 whitespace-nowrap'>
                      <div className='flex items-center gap-1.5 text-slate-700 font-semibold'>
                        <Store className='w-3.5 h-3.5 text-indigo-500 shrink-0' />
                        <span>{p.storeName || 'Veloura Official'}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className='py-3.5 px-4 whitespace-nowrap'>
                      {getStatusBadge(p.computedTrendingStatus)}
                    </td>

                    {/* Priority */}
                    <td className='py-3.5 px-4 whitespace-nowrap'>
                      <span className='px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-extrabold'>
                        #{p.trending?.priority || 1}
                      </span>
                    </td>

                    {/* Start Date */}
                    <td className='py-3.5 px-4 whitespace-nowrap text-slate-500 text-[11px]'>
                      {formatDate(p.trending?.startAt)}
                    </td>

                    {/* End Date */}
                    <td className='py-3.5 px-4 whitespace-nowrap text-slate-500 text-[11px]'>
                      {formatDate(p.trending?.endAt)}
                    </td>

                    {/* Action Buttons */}
                    <td className='py-3.5 px-4 whitespace-nowrap text-right'>
                      <div className='flex items-center justify-end gap-1.5'>
                        {/* Configure / Edit Settings */}
                        <button
                          onClick={() => openConfigModal(p)}
                          className='p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors cursor-pointer'
                          title='Configure Trending Settings'
                        >
                          <Settings className='w-4 h-4' />
                        </button>

                        {/* Approve Request (If pending) */}
                        {p.computedTrendingStatus === 'PENDING' && (
                          <button
                            onClick={() => openConfigModal(p)}
                            className='px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1'
                          >
                            <CheckCircle className='w-3.5 h-3.5' /> Approve
                          </button>
                        )}

                        {/* Remove Trending (If currently active or scheduled) */}
                        {(p.computedTrendingStatus === 'ACTIVE' || p.computedTrendingStatus === 'SCHEDULED') && (
                          <button
                            onClick={() => setRemoveModalProduct(p)}
                            className='p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer'
                            title='Remove from Homepage Trending'
                          >
                            <Slash className='w-4 h-4' />
                          </button>
                        )}

                        {/* Delete Product */}
                        <button
                          onClick={() => setDeleteModalProduct(p)}
                          className='p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer'
                          title='Delete Product from Store'
                        >
                          <Trash2 className='w-4 h-4' />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 1. CONFIGURATION MODAL */}
      {/* ---------------------------------------------------- */}
      {configModalProduct && (
        <div className='fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4'>
          <div className='bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200 border border-slate-200'>
            <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
              <div className='flex items-center gap-2'>
                <Flame className='w-5 h-5 text-orange-500' />
                <h3 className='font-bold text-base text-slate-900'>Configure Trending Settings</h3>
              </div>
              <button
                onClick={() => setConfigModalProduct(null)}
                className='p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer'
              >
                <X className='w-5 h-5' />
              </button>
            </div>

            {/* Product Summary */}
            <div className='flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80'>
              <img
                src={Array.isArray(configModalProduct.image) ? configModalProduct.image[0] : configModalProduct.image}
                alt={configModalProduct.name}
                className='w-12 h-12 object-cover rounded-xl border border-slate-200 shrink-0'
              />
              <div>
                <p className='font-bold text-slate-900 text-xs'>{configModalProduct.name}</p>
                <p className='text-[11px] text-slate-500 font-medium'>
                  {currency}{configModalProduct.price} • Seller: {configModalProduct.storeName || 'Veloura Official'}
                </p>
              </div>
            </div>

            {/* Toggle Trending Switch */}
            <div className='flex items-center justify-between p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100'>
              <div>
                <p className='font-bold text-slate-900 text-xs'>Enable Homepage Trending</p>
                <p className='text-[11px] text-slate-500'>Display in 🔥 Trending / Hot Products section</p>
              </div>
              <button
                type='button'
                onClick={() => setFormEnabled(!formEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  formEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    formEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Duration Presets */}
            <div className='space-y-2'>
              <label className='text-xs font-bold text-slate-700 block'>Select Duration Preset</label>
              <div className='grid grid-cols-3 gap-2'>
                {[
                  { id: '24h', label: '24 Hours' },
                  { id: '3d', label: '3 Days' },
                  { id: '7d', label: '7 Days' },
                  { id: '14d', label: '14 Days' },
                  { id: '30d', label: '30 Days' },
                  { id: 'custom', label: 'Custom Dates' }
                ].map(p => (
                  <button
                    key={p.id}
                    type='button'
                    onClick={() => setFormDurationPreset(p.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      formDurationPreset === p.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Pickers if custom selected */}
            {formDurationPreset === 'custom' && (
              <div className='grid grid-cols-2 gap-3 pt-1'>
                <div>
                  <label className='text-[11px] font-bold text-slate-600 block mb-1'>Start Date & Time</label>
                  <input
                    type='datetime-local'
                    value={formCustomStart}
                    onChange={(e) => setFormCustomStart(e.target.value)}
                    className='w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500'
                  />
                </div>
                <div>
                  <label className='text-[11px] font-bold text-slate-600 block mb-1'>End Date & Time</label>
                  <input
                    type='datetime-local'
                    value={formCustomEnd}
                    onChange={(e) => setFormCustomEnd(e.target.value)}
                    className='w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500'
                  />
                </div>
              </div>
            )}

            {/* Priority input */}
            <div>
              <label className='text-xs font-bold text-slate-700 block mb-1'>Display Priority Order</label>
              <input
                type='number'
                min='1'
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value)}
                placeholder='1 (Highest priority)'
                className='w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500'
              />
              <p className='text-[10px] text-slate-400 mt-1'>Lower numbers (e.g. 1) appear first on the homepage.</p>
            </div>

            {/* Action Buttons */}
            <div className='flex items-center justify-end gap-2 border-t border-slate-100 pt-4'>
              {configModalProduct.computedTrendingStatus === 'PENDING' && (
                <button
                  type='button'
                  onClick={() => handleSaveConfig('REJECT')}
                  className='px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer'
                >
                  Reject Request
                </button>
              )}
              <button
                type='button'
                onClick={() => handleSaveConfig('CONFIGURE')}
                className='px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer'
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. REMOVE FROM TRENDING CONFIRMATION MODAL */}
      {/* ---------------------------------------------------- */}
      {removeModalProduct && (
        <div className='fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4'>
          <div className='bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-200'>
            <div className='flex items-center gap-3 text-amber-600 bg-amber-50 p-3 rounded-2xl border border-amber-200'>
              <AlertTriangle className='w-6 h-6 shrink-0' />
              <div>
                <h4 className='font-bold text-sm text-amber-950'>Remove from Trending?</h4>
                <p className='text-xs text-amber-800 font-medium'>
                  "{removeModalProduct.name}" will immediately stop appearing on the homepage Trending section.
                </p>
              </div>
            </div>

            <p className='text-xs text-slate-600 leading-normal'>
              <strong>Note:</strong> The product itself will <strong>NOT</strong> be deleted from the store. It will remain active in the normal catalog.
            </p>

            <div className='flex items-center justify-end gap-2 pt-2'>
              <button
                onClick={() => setRemoveModalProduct(null)}
                className='px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer'
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveTrending}
                className='px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-2xs cursor-pointer'
              >
                Confirm Remove Trending
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. DELETE PRODUCT CONFIRMATION MODAL */}
      {/* ---------------------------------------------------- */}
      {deleteModalProduct && (
        <div className='fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4'>
          <div className='bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-200'>
            <div className='flex items-center gap-3 text-rose-600 bg-rose-50 p-3 rounded-2xl border border-rose-200'>
              <Trash2 className='w-6 h-6 shrink-0' />
              <div>
                <h4 className='font-bold text-sm text-rose-950'>Permanently Delete Product?</h4>
                <p className='text-xs text-rose-800 font-medium'>
                  Are you sure you want to delete "{deleteModalProduct.name}"?
                </p>
              </div>
            </div>

            <p className='text-xs text-slate-600 leading-normal'>
              This will completely remove the product from the store catalog and clean up any active trending references.
            </p>

            <div className='flex items-center justify-end gap-2 pt-2'>
              <button
                onClick={() => setDeleteModalProduct(null)}
                className='px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer'
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProduct}
                className='px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-2xs cursor-pointer'
              >
                Delete Product Completely
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendingManagement;
