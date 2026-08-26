import React, { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Settings as SettingsIcon, Lock, Bell, ShieldCheck, LogOut, Trash2, AlertTriangle } from 'lucide-react';

const Settings = ({ token, setToken }) => {
  const [notifications, setNotifications] = useState({
    emailOrders: true,
    lowStockAlerts: true,
    payoutAlerts: true
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  const handleToggle = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success("Preference updated");
  };

  const handleLogout = () => {
    localStorage.removeItem('seller_token');
    if (setToken) setToken('');
    toast.success("Logged out successfully!");
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await axios.post(`${backendUrl}/api/seller/delete-account`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        toast.success("Your seller account has been permanently deleted.");
        localStorage.removeItem('seller_token');
        if (setToken) setToken('');
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Account & Notification Settings</h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Configure security, order alerts, session controls, and seller account options.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs space-y-8">
        {/* Notifications */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
            <Bell className="w-4 h-4 text-slate-600" />
            <span>Notification Preferences</span>
          </h3>

          <div className="space-y-3">
            {[
              { key: 'emailOrders', title: 'New Customer Order Alerts', desc: 'Receive instant email notification when a customer places an order containing your products.' },
              { key: 'lowStockAlerts', title: 'Low Stock Warnings', desc: 'Receive alerts when variant size stock drops below 5 units.' },
              { key: 'payoutAlerts', title: 'Bank Payout Confirmation', desc: 'Receive status updates when payout requests are processed by admin.' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                  <p className="text-[11px] text-slate-500">{item.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications[item.key]}
                  onChange={() => handleToggle(item.key)}
                  className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Security & Session Controls */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-600" />
            <span>Security & Session Actions</span>
          </h3>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-3">
            <div>
              <p className="font-bold text-slate-800">Role-Based Authorization Active</p>
              <p className="mt-0.5">Your seller account token is verified per API request with role scoping on backend database queries.</p>
            </div>

            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">Sign Out of Seller Session</p>
                <p className="text-[11px] text-slate-500">Disconnect active login token from this browser.</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone: Delete Account */}
        <div className="space-y-4 pt-4 border-t border-rose-100">
          <h3 className="text-xs font-bold text-rose-600 uppercase tracking-wider border-b border-rose-100 pb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Danger Zone</span>
          </h3>

          <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-rose-900">Delete Seller Account</h4>
              <p className="text-[11px] text-rose-700 mt-0.5">
                Permanently close your store, delete your seller credentials, and remove all your listed products.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 shrink-0 cursor-pointer active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xl mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900">Delete Seller Account?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to permanently delete your seller store? All your listed products will be removed. This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
