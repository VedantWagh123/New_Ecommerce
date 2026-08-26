import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';

const SubAdmins = ({ token }) => {
  const [subAdmins, setSubAdmins] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('support');

  const fetchSubAdmins = async () => {
    try {
      setLoading(true);
      const response = await axios.get(backendUrl + '/api/user/sub-admins', { headers: { token } });
      if (response.data.success) {
        setSubAdmins(response.data.subAdmins);
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
    fetchSubAdmins();
  }, [token]);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(backendUrl + '/api/user/add-sub-admin', {
        name,
        email,
        password,
        role
      }, { headers: { token } });

      if (response.data.success) {
        toast.success(response.data.message);
        setName('');
        setEmail('');
        setPassword('');
        fetchSubAdmins();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const deleteSubAdmin = async (adminId) => {
    if (!window.confirm("Are you sure you want to delete this sub-admin?")) return;
    try {
      const response = await axios.post(backendUrl + '/api/user/delete-sub-admin', { adminId }, { headers: { token } });
      if (response.data.success) {
        toast.success(response.data.message);
        fetchSubAdmins();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className='max-w-5xl mx-auto'>
      <div className="mb-8">
        <h1 className='text-2xl font-bold text-slate-900'>Manage Sub-Admins</h1>
        <p className='text-sm text-slate-500'>Create roles for Customer Support and Marketing teams.</p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
        {/* Create Sub-Admin Form */}
        <div className='md:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100'>
          <h2 className='text-lg font-bold text-slate-800 mb-4'>Add Sub-Admin</h2>
          <form onSubmit={onSubmitHandler} className='flex flex-col gap-4'>
            <div>
              <label className='text-xs font-semibold text-slate-600 block mb-1'>Name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className='w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500 transition-all' placeholder="John Doe" />
            </div>
            <div>
              <label className='text-xs font-semibold text-slate-600 block mb-1'>Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className='w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500 transition-all' placeholder="john@example.com" />
            </div>
            <div>
              <label className='text-xs font-semibold text-slate-600 block mb-1'>Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className='w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500 transition-all' placeholder="Secure password" />
            </div>
            <div>
              <label className='text-xs font-semibold text-slate-600 block mb-1'>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className='w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500 transition-all'>
                <option value="support">Customer Support (Orders only)</option>
                <option value="marketing">Marketing (Coupons, Sales)</option>
              </select>
            </div>
            <button type="submit" className='mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg text-sm transition-colors shadow-sm'>
              Create Sub-Admin
            </button>
          </form>
        </div>

        {/* List of Sub-Admins */}
        <div className='md:col-span-2'>
          <div className='bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden'>
            <div className='px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50'>
              <h2 className='text-sm font-bold text-slate-800 uppercase tracking-wider'>Active Sub-Admins</h2>
              <span className='px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full'>{subAdmins.length} Users</span>
            </div>
            
            {loading ? (
              <div className='p-8 text-center text-slate-500 text-sm'>Loading...</div>
            ) : subAdmins.length === 0 ? (
              <div className='p-12 text-center text-slate-500 flex flex-col items-center gap-2'>
                <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                <p>No sub-admins found.</p>
              </div>
            ) : (
              <div className='divide-y divide-slate-100'>
                {subAdmins.map((admin) => (
                  <div key={admin._id} className='p-4 hover:bg-slate-50 flex items-center justify-between transition-colors'>
                    <div className='flex items-center gap-4'>
                      <div className='w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold'>
                        {admin.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className='font-bold text-slate-900 text-sm'>{admin.name}</p>
                        <p className='text-xs text-slate-500'>{admin.email}</p>
                      </div>
                    </div>
                    <div className='flex items-center gap-4'>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        admin.role === 'marketing' ? 'bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}>
                        {admin.role}
                      </span>
                      <button 
                        onClick={() => deleteSubAdmin(admin._id)}
                        className='p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors'
                        title="Delete Sub-Admin"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
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

export default SubAdmins;
