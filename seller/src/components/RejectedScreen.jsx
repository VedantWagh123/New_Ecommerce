import React from 'react';
import { XCircle, LogOut, Mail } from 'lucide-react';

const RejectedScreen = ({ storeInfo, rejectionReason, onLogout }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center animate-fade-in">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-rose-100 shadow-sm">
          <XCircle className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">Application Rejected</h1>
        <p className="text-sm text-slate-500 leading-relaxed mb-6">
          Unfortunately, your seller registration for <span className="font-bold text-slate-800">{storeInfo?.storeName || 'your store'}</span> could not be approved at this time.
        </p>

        {/* Reason Box */}
        <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 text-left mb-6">
          <p className="text-xs font-bold text-rose-800 mb-1">Reason for decision:</p>
          <p className="text-xs text-rose-700 leading-relaxed">
            {rejectionReason || 'The application did not satisfy our multi-vendor store guidelines.'}
          </p>
        </div>

        <p className="text-xs text-slate-400 mb-6">
          If you believe this was an error or would like to re-submit corrected business details, please contact our support team.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="mailto:support@forever.com"
            className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <Mail className="w-4 h-4" />
            <span>Contact Admin Support</span>
          </a>

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

export default RejectedScreen;
