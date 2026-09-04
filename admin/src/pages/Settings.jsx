import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { backendUrl } from '../App';
import { Settings as SettingsIcon, Save, RefreshCw } from 'lucide-react';

const GlobalSettings = ({ token, role }) => {
    const [platformCommission, setPlatformCommission] = useState(10);
    const [autoAssignDelivery, setAutoAssignDelivery] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const fetchSettings = async () => {
        try {
            setFetching(true);
            const res = await axios.get(`${backendUrl}/api/settings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success && res.data.settings) {
                setPlatformCommission(res.data.settings.platformCommission);
                setAutoAssignDelivery(res.data.settings.autoAssignDelivery || false);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch settings");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        if (token) fetchSettings();
    }, [token]);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const res = await axios.post(
                `${backendUrl}/api/settings/update`, 
                { platformCommission: Number(platformCommission), autoAssignDelivery },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                toast.success(res.data.message);
            } else {
                toast.error(res.data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error("Error updating settings");
        } finally {
            setLoading(false);
        }
    };

    if (role === 'support' || role === 'marketing') {
        return (
            <div className="flex items-center justify-center h-[70vh]">
                <div className="text-center">
                    <SettingsIcon className="w-16 h-16 text-rose-300 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-800">Access Restricted</h2>
                    <p className="text-slate-500 mt-2">Only Super Admins can access global settings.</p>
                </div>
            </div>
        );
    }

    return (
        <div className='max-w-3xl mx-auto space-y-8 animate-fade-in'>
            <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm'>
                <div>
                    <div className='flex items-center gap-3'>
                        <span className='p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/20'>
                            <SettingsIcon className='w-7 h-7' />
                        </span>
                        <div>
                            <h1 className='text-2xl font-bold text-slate-900'>Global Settings</h1>
                            <p className='text-sm text-slate-500 font-medium'>
                                Manage platform-wide configurations and rules.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSave} className='bg-white p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6'>
                {fetching ? (
                    <div className="flex justify-center p-8">
                        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
                    </div>
                ) : (
                    <>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 mb-2">Platform Finances</h2>
                            <div className="space-y-4 max-w-sm">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                                        Platform Commission (%)
                                    </label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            min="0" 
                                            max="100" 
                                            step="0.1"
                                            required
                                            value={platformCommission}
                                            onChange={(e) => setPlatformCommission(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                        />
                                        <span className="absolute right-4 top-3 text-slate-400 font-bold">%</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2 font-medium">
                                        This percentage is automatically deducted from the seller's earnings during automated Razorpay payouts.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900 mb-2">Automation Engine (Auto-Pilot)</h2>
                            <p className="text-sm text-slate-500 font-medium mb-6">
                                Enable this to automatically accept orders with available inventory and instantly assign them to online delivery boys.
                            </p>
                            <div className="flex items-center gap-4">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={autoAssignDelivery}
                                        onChange={() => setAutoAssignDelivery(!autoAssignDelivery)}
                                    />
                                    <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600 shadow-inner"></div>
                                    <span className="ml-3 text-sm font-bold text-slate-700">
                                        {autoAssignDelivery ? "Auto-Pilot is ON" : "Auto-Pilot is OFF"}
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                            >
                                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Settings
                            </button>
                        </div>
                    </>
                )}
            </form>
        </div>
    );
};

export default GlobalSettings;
