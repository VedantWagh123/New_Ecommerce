import React from 'react';
import { Clock, ShieldAlert, RefreshCw, LogOut, CheckCircle2 } from 'lucide-react';

const PendingApproval = ({ storeInfo, onCheckStatus, onLogout }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center animate-fade-in">
        <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-100 shadow-sm animate-pulse">
          <Clock className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">Application Pending Approval</h1>
        <p className="text-sm text-slate-500 leading-relaxed mb-6">
          Thank you for registering <span className="font-bold text-slate-800">{storeInfo?.storeName || 'your store'}</span> with Forever! Your seller account is currently under review by our admin moderation team.
        </p>

        {/* Status Stepper */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 mb-6 text-left space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-800">Seller Registration Submitted</p>
              <p className="text-[11px] text-slate-400">Application details & contact credentials received</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-amber-500 border-t-transparent animate-spin shrink-0"></div>
            <div>
              <p className="text-xs font-bold text-slate-800">Admin Document & Store Review</p>
              <p className="text-[11px] text-amber-600 font-medium">Currently reviewing your store details</p>
            </div>
          </div>

          <div className="flex items-center gap-3 opacity-40">
            <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold shrink-0">
              3
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Seller Dashboard Access Granted</p>
              <p className="text-[11px] text-slate-400">Full access to list products and fulfill orders</p>
            </div>
          </div>
        </div>

        {/* Info Callout */}
        <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5 text-xs text-blue-700 mb-6 flex items-center gap-2 text-left">
          <ShieldAlert className="w-4 h-4 shrink-0 text-blue-500" />
          <span>Approval typically takes 1-2 business hours. You can check back shortly!</span>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onCheckStatus}
            className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Check Approval Status</span>
          </button>

          <button
            onClick={onLogout}
            className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;
