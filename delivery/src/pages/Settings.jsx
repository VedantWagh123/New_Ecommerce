import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Settings as SettingsIcon, Lock, Bell, ShieldCheck, LogOut, CheckCircle2, User, Truck, MapPin } from 'lucide-react';

const Settings = ({ token, setToken }) => {
  const [partnerInfo, setPartnerInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState({
    newAssignments: true,
    routeUpdates: true,
    payoutAlerts: true
  });

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          setPartnerInfo(response.data.user);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchProfile();
  }, [token]);

  const handleToggle = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success("Preference updated");
  };

  const handleLogout = () => {
    localStorage.removeItem('delivery_token');
    if (setToken) setToken('');
    toast.success("Logged out successfully!");
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div className="h-40 bg-white rounded-3xl animate-pulse"></div>
        <div className="h-64 bg-white rounded-3xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6 animate-fade-in min-h-screen">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Wishmaster Profile</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Manage your delivery profile, vehicle details, and account settings.
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-slate-100 border-4 border-white shadow-md flex items-center justify-center shrink-0">
          <User className="w-12 h-12 text-slate-400" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900 flex items-center justify-center sm:justify-start gap-2">
                {partnerInfo?.name || 'Wishmaster'}
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </h2>
              <p className="text-sm text-slate-500 font-medium mt-1">{partnerInfo?.email}</p>
            </div>
            <span className="px-4 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
              Verified Partner
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-center sm:justify-start gap-3 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100">
              <Truck className="w-5 h-5 text-indigo-500 shrink-0" />
              <div className="text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vehicle</p>
                <p className="text-sm font-bold text-slate-800">{partnerInfo?.deliveryVehicle || '2-Wheeler'}</p>
              </div>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-3 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100">
              <MapPin className="w-5 h-5 text-indigo-500 shrink-0" />
              <div className="text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Service City</p>
                <p className="text-sm font-bold text-slate-800">{partnerInfo?.serviceCity || 'Default City'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
        {/* Notifications */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
            <Bell className="w-4 h-4 text-slate-500" />
            <span>Notification Preferences</span>
          </h3>

          <div className="space-y-3">
            {[
              { key: 'newAssignments', title: 'New Assignment Alerts', desc: 'Receive instant notifications when a new order is assigned to you.' },
              { key: 'routeUpdates', title: 'Route Updates', desc: 'Receive alerts regarding address changes or traffic.' },
              { key: 'payoutAlerts', title: 'Weekly Payout Notifications', desc: 'Receive status updates when your earnings are transferred.' },
            ].map(item => (
              <div key={item.key} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                </div>
                <button
                  onClick={() => handleToggle(item.key)}
                  className={`w-12 h-6 rounded-full relative transition-colors shrink-0 ${notifications[item.key] ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${notifications[item.key] ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Session Controls */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-500" />
            <span>Security & Account Access</span>
          </h3>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-sm text-slate-600 space-y-4">
            <div>
              <p className="font-bold text-slate-800 mb-1">Account Status: Active</p>
              <p className="text-xs">Your Wishmaster account is in good standing and authorized for deliveries.</p>
            </div>

            <div className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-bold text-slate-900">Sign Out of Portal</p>
                <p className="text-xs text-slate-500 mt-0.5">Disconnect your session from this device securely.</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
