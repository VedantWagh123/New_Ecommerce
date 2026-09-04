import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Store, Phone, FileText, Building2, CreditCard, Save, Image as ImageIcon } from 'lucide-react';

const StoreProfile = ({ token, setStoreInfo }) => {
  const [profile, setProfile] = useState({
    name: '',
    storeName: '',
    storePhone: '',
    storeCity: '',
    storePincode: '',
    storeDescription: '',
    storeLogo: '',
    bankDetails: {
      accountHolder: '',
      accountNumber: '',
      bankName: '',
      ifscCode: ''
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${backendUrl}/api/seller/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setProfile(response.data.profile);
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
      fetchProfile();
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await axios.post(`${backendUrl}/api/seller/profile/update`, {
        name: profile.name,
        storeName: profile.storeName,
        storePhone: profile.storePhone,
        storeCity: profile.storeCity,
        storePincode: profile.storePincode,
        storeDescription: profile.storeDescription,
        storeLogo: profile.storeLogo,
        bankDetails: profile.bankDetails
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success(response.data.message);
        if (setStoreInfo && response.data.profile) {
          setStoreInfo(response.data.profile);
        }
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading store profile...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Store Branding & Bank Details</h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Manage your seller store name, brand logo, contact phone, and payout bank credentials.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs space-y-8">
        {/* Store Public Identity */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
            Store Identity
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Owner Name</label>
              <input
                type="text"
                required
                value={profile.name || ''}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Store / Brand Name</label>
              <input
                type="text"
                required
                value={profile.storeName || ''}
                onChange={(e) => setProfile({ ...profile, storeName: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Support Phone</label>
              <input
                type="text"
                value={profile.storePhone || ''}
                onChange={(e) => setProfile({ ...profile, storePhone: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Base City (Operations)</label>
              <input
                type="text"
                value={profile.storeCity || ''}
                onChange={(e) => setProfile({ ...profile, storeCity: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                placeholder="e.g. Nagpur"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Base Pincode</label>
              <input
                type="text"
                value={profile.storePincode || ''}
                onChange={(e) => setProfile({ ...profile, storePincode: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                placeholder="e.g. 440001"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Store Logo Image URL</label>
              <input
                type="text"
                value={profile.storeLogo || ''}
                onChange={(e) => setProfile({ ...profile, storeLogo: e.target.value })}
                placeholder="https://..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Store Description</label>
              <textarea
                rows="3"
                value={profile.storeDescription || ''}
                onChange={(e) => setProfile({ ...profile, storeDescription: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Bank Account Details for Payouts */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
            Bank Account Credentials (For Payouts)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Account Holder Name</label>
              <input
                type="text"
                value={profile.bankDetails?.accountHolder || ''}
                onChange={(e) => setProfile({
                  ...profile,
                  bankDetails: { ...profile.bankDetails, accountHolder: e.target.value }
                })}
                placeholder="e.g. Veloura Fashion LLC"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name</label>
              <input
                type="text"
                value={profile.bankDetails?.bankName || ''}
                onChange={(e) => setProfile({
                  ...profile,
                  bankDetails: { ...profile.bankDetails, bankName: e.target.value }
                })}
                placeholder="e.g. Chase Bank"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Account Number</label>
              <input
                type="text"
                value={profile.bankDetails?.accountNumber || ''}
                onChange={(e) => setProfile({
                  ...profile,
                  bankDetails: { ...profile.bankDetails, accountNumber: e.target.value }
                })}
                placeholder="•••• •••• •••• 9876"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">IFSC / SWIFT / Routing Code</label>
              <input
                type="text"
                value={profile.bankDetails?.ifscCode || ''}
                onChange={(e) => setProfile({
                  ...profile,
                  bankDetails: { ...profile.bankDetails, ifscCode: e.target.value }
                })}
                placeholder="CHASUS33XXX"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex justify-between items-center">
            <span>Automated Payouts (Razorpay Route)</span>
            {profile.razorpayAccountId ? (
               <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px]">Active</span>
            ) : (
               <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-[10px]">Pending Onboarding</span>
            )}
          </h3>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            {profile.razorpayAccountId ? (
              <div>
                 <p className="text-sm font-bold text-slate-800">Your store is connected for automated payouts.</p>
                 <p className="text-xs text-slate-500 mt-1">Razorpay Account ID: <span className="font-mono bg-slate-200 px-1 rounded">{profile.razorpayAccountId}</span></p>
                 <p className="text-xs text-slate-500 mt-2">Payouts for prepaid orders will automatically settle into your bank account. COD payouts will still need to be requested manually.</p>
              </div>
            ) : (
              <div>
                 <p className="text-sm font-bold text-slate-800">Enable Automated Split Payments</p>
                 <p className="text-xs text-slate-500 mt-1 mb-4">Connect your store with Razorpay to receive your earnings automatically for all prepaid orders. Ensure your Bank Details above are correct and saved before continuing.</p>
                 <button
                    type="button"
                    onClick={async () => {
                       try {
                          const res = await axios.post(`${backendUrl}/api/seller/onboard-razorpay`, { sellerId: profile._id }, { headers: { Authorization: `Bearer ${token}` } });
                          if(res.data.success) {
                             toast.success(res.data.message);
                             fetchProfile();
                          } else {
                             toast.error(res.data.message);
                          }
                       } catch (e) {
                          toast.error(e.response?.data?.message || e.message);
                       }
                    }}
                    className="px-4 py-2 bg-[#3395FF] hover:bg-[#257AE6] text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                 >
                    Onboard with Razorpay
                 </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="py-3 px-8 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default StoreProfile;
