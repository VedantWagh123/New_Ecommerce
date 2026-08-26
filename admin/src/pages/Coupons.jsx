import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';

const Coupons = ({ token }) => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [type, setType] = useState('percentage');
  const [value, setValue] = useState(0);
  const [minCartValue, setMinCartValue] = useState(0);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [bogoBuy, setBogoBuy] = useState(1);
  const [bogoGet, setBogoGet] = useState(1);

  const availableCategories = ['Men', 'Women', 'Kids'];
  const availableSubCategories = ['Topwear', 'Bottomwear', 'Winterwear'];

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await axios.get(backendUrl + '/api/coupon/list', { headers: { token } });
      if (response.data.success) {
        setCoupons(response.data.coupons);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [token]);

  const toggleSelection = (item, list, setList) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (type === 'bogo') {
      setValue(0); // BOGO doesn't use standard value
    }

    try {
      const payload = {
        code,
        type,
        value: Number(value),
        minCartValue: Number(minCartValue),
        conditions: {
          categories,
          subCategories,
          bogo: { buy: Number(bogoBuy), get: Number(bogoGet) }
        }
      };

      const response = await axios.post(backendUrl + '/api/coupon/add', payload, { headers: { token } });

      if (response.data.success) {
        toast.success(response.data.message);
        setCode('');
        setValue(0);
        setMinCartValue(0);
        setCategories([]);
        setSubCategories([]);
        fetchCoupons();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const toggleCouponStatus = async (id) => {
    try {
      const response = await axios.post(backendUrl + '/api/coupon/toggle', { id }, { headers: { token } });
      if (response.data.success) {
        toast.success(response.data.message);
        fetchCoupons();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const deleteCoupon = async (id) => {
    if (!window.confirm("Delete this coupon?")) return;
    try {
      const response = await axios.post(backendUrl + '/api/coupon/delete', { id }, { headers: { token } });
      if (response.data.success) {
        toast.success(response.data.message);
        fetchCoupons();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className='max-w-6xl mx-auto'>
      <div className="mb-8">
        <h1 className='text-2xl font-bold text-slate-900'>Coupons Engine (Beta)</h1>
        <p className='text-sm text-slate-500'>Create complex rules-based promotional offers.</p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
        {/* Create Coupon Form */}
        <div className='lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-slate-100'>
          <h2 className='text-lg font-bold text-slate-800 mb-4'>Create Dynamic Coupon</h2>
          <form onSubmit={onSubmitHandler} className='flex flex-col gap-5'>
            
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='text-xs font-semibold text-slate-600 block mb-1'>Coupon Code</label>
                <input type="text" required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className='w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold uppercase' placeholder="e.g. WINTER50" />
              </div>
              <div>
                <label className='text-xs font-semibold text-slate-600 block mb-1'>Discount Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className='w-full px-3 py-2 border border-slate-300 rounded-lg text-sm'>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                  <option value="bogo">Buy X Get Y (BOGO)</option>
                </select>
              </div>
            </div>

            {type !== 'bogo' && (
              <div>
                <label className='text-xs font-semibold text-slate-600 block mb-1'>
                  Discount {type === 'percentage' ? 'Percentage (%)' : 'Amount (₹)'}
                </label>
                <input type="number" required min="1" max={type === 'percentage' ? "100" : "100000"} value={value} onChange={(e) => setValue(e.target.value)} className='w-full px-3 py-2 border border-slate-300 rounded-lg text-sm' />
              </div>
            )}

            {type === 'bogo' && (
              <div className='grid grid-cols-2 gap-4 bg-fuchsia-50 p-3 rounded-xl border border-fuchsia-100'>
                <div>
                  <label className='text-[10px] font-bold text-fuchsia-800 block mb-1 uppercase tracking-wide'>Buy (Qty)</label>
                  <input type="number" required min="1" value={bogoBuy} onChange={(e) => setBogoBuy(e.target.value)} className='w-full px-3 py-2 border border-fuchsia-200 rounded-lg text-sm' />
                </div>
                <div>
                  <label className='text-[10px] font-bold text-fuchsia-800 block mb-1 uppercase tracking-wide'>Get Free (Qty)</label>
                  <input type="number" required min="1" value={bogoGet} onChange={(e) => setBogoGet(e.target.value)} className='w-full px-3 py-2 border border-fuchsia-200 rounded-lg text-sm' />
                </div>
              </div>
            )}

            <div>
              <label className='text-xs font-semibold text-slate-600 block mb-1'>Minimum Cart Value (₹)</label>
              <input type="number" min="0" value={minCartValue} onChange={(e) => setMinCartValue(e.target.value)} className='w-full px-3 py-2 border border-slate-300 rounded-lg text-sm' placeholder="0 for no minimum" />
            </div>

            <div className='bg-slate-50 p-4 rounded-xl border border-slate-200'>
              <h3 className='text-xs font-bold text-slate-800 mb-3 uppercase tracking-wider'>Product Conditions</h3>
              
              <div className='mb-4'>
                <label className='text-[10px] font-bold text-slate-500 block mb-2'>Applicable Categories (Leave empty for ALL)</label>
                <div className='flex flex-wrap gap-2'>
                  {availableCategories.map(cat => (
                    <button type="button" key={cat} onClick={() => toggleSelection(cat, categories, setCategories)} className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${categories.includes(cat) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className='text-[10px] font-bold text-slate-500 block mb-2'>Applicable Sub-Categories (Leave empty for ALL)</label>
                <div className='flex flex-wrap gap-2'>
                  {availableSubCategories.map(sub => (
                    <button type="button" key={sub} onClick={() => toggleSelection(sub, subCategories, setSubCategories)} className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${subCategories.includes(sub) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300'}`}>
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button type="submit" className='mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-sm transition-colors shadow-sm uppercase tracking-wide'>
              Create Coupon
            </button>
          </form>
        </div>

        {/* List of Coupons */}
        <div className='lg:col-span-7'>
          <div className='bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden'>
            <div className='px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50'>
              <h2 className='text-sm font-bold text-slate-800 uppercase tracking-wider'>Active Rules</h2>
              <span className='px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full'>{coupons.length} Offers</span>
            </div>
            
            {loading ? (
              <div className='p-8 text-center text-slate-500 text-sm'>Loading Engine Rules...</div>
            ) : coupons.length === 0 ? (
              <div className='p-12 text-center text-slate-500 flex flex-col items-center gap-2'>
                <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                <p>No coupons found.</p>
              </div>
            ) : (
              <div className='divide-y divide-slate-100'>
                {coupons.map((coupon) => (
                  <div key={coupon._id} className={`p-4 transition-colors ${coupon.isActive ? 'hover:bg-slate-50' : 'bg-slate-50/50 opacity-70'}`}>
                    <div className='flex justify-between items-start mb-2'>
                      <div className='flex items-center gap-3'>
                        <span className='px-3 py-1 bg-slate-900 text-white font-black tracking-widest rounded text-sm'>
                          {coupon.code}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${coupon.type === 'bogo' ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {coupon.type === 'bogo' ? `Buy ${coupon.conditions.bogo.buy} Get ${coupon.conditions.bogo.get}` : `${coupon.value}${coupon.type === 'percentage' ? '%' : '₹'} OFF`}
                        </span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <button onClick={() => toggleCouponStatus(coupon._id)} className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md transition-colors ${coupon.isActive ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}>
                          {coupon.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => deleteCoupon(coupon._id)} className='text-slate-400 hover:text-rose-600 transition-colors'>
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className='flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 mt-3'>
                      <p>Min Cart: <span className='font-bold text-slate-700'>₹{coupon.minCartValue}</span></p>
                      
                      {coupon.conditions.categories?.length > 0 && (
                        <p>Categories: <span className='font-bold text-slate-700'>{coupon.conditions.categories.join(', ')}</span></p>
                      )}
                      
                      {coupon.conditions.subCategories?.length > 0 && (
                        <p>Sub-Categories: <span className='font-bold text-slate-700'>{coupon.conditions.subCategories.join(', ')}</span></p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Coupons;
