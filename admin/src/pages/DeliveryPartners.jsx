import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';
import { Truck, Check, X, Trash2 } from 'lucide-react';

const DeliveryPartners = ({ token }) => {
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');

    const fetchPartners = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${backendUrl}/api/user/delivery-partners`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setPartners(response.data.partners);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchPartners();
        }
    }, [token]);

    const handleApprove = async (partnerId) => {
        try {
            const response = await axios.post(`${backendUrl}/api/user/delivery-partner/approve`, { partnerId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                toast.success(response.data.message);
                fetchPartners();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleReject = async (partnerId) => {
        if (!window.confirm(`Are you sure you want to reject this application?`)) return;
        try {
            const response = await axios.post(`${backendUrl}/api/user/delivery-partner/reject`, { partnerId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                toast.success(response.data.message);
                fetchPartners();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const filteredPartners = partners.filter(p => {
        if (filterStatus === 'all') return true;
        return p.deliveryStatus === filterStatus;
    });

    return (
        <div className="p-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Delivery Partner Approval</h1>
                    <p className="text-sm text-gray-500">Review fleet applications, approve Wishmasters, and manage active delivery personnel.</p>
                </div>
                <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                    {['all', 'pending', 'approved', 'rejected'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                                filterStatus === status
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20 text-indigo-500">
                    <span className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></span>
                </div>
            ) : filteredPartners.length === 0 ? (
                <div className="bg-white border rounded-2xl p-12 text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
                        <Truck className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">No Partners Found</h3>
                    <p className="text-sm text-gray-500 mt-1 max-w-sm">No delivery partners match the current "{filterStatus}" filter.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredPartners.map((partner) => (
                        <div key={partner._id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                        <Truck className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{partner.name}</h3>
                                        <p className="text-xs text-gray-500">{partner.email} &bull; {partner.phone}</p>
                                    </div>
                                </div>
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                                    partner.deliveryStatus === 'approved'
                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                        : partner.deliveryStatus === 'pending'
                                        ? 'bg-amber-50 text-amber-600 border border-amber-100 animate-pulse'
                                        : 'bg-rose-50 text-rose-600 border border-rose-100'
                                }`}>
                                    {partner.deliveryStatus}
                                </span>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 mb-5 flex-1 border border-gray-100">
                                <h4 className="text-[10px] font-bold uppercase text-gray-500 mb-3 tracking-wider">Fleet Details</h4>
                                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                                    <div>
                                        <p className="text-xs text-gray-400 font-medium">Vehicle</p>
                                        <p className="font-semibold text-gray-800">{partner.deliveryVehicle || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-medium">Service City</p>
                                        <p className="font-semibold text-gray-800">{partner.serviceCity || 'N/A'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs text-gray-400 font-medium">Driving License</p>
                                        <p className="font-mono text-xs font-semibold text-gray-700 bg-white px-2 py-1 rounded border inline-block mt-1">{partner.drivingLicense || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-auto">
                                {partner.deliveryStatus !== 'approved' && (
                                    <button
                                        onClick={() => handleApprove(partner._id)}
                                        className="flex-1 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                                    >
                                        <Check className="w-4 h-4" /> APPROVE PARTNER
                                    </button>
                                )}
                                {partner.deliveryStatus !== 'rejected' && (
                                    <button
                                        onClick={() => handleReject(partner._id)}
                                        className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-all border border-rose-100 flex items-center justify-center gap-2"
                                    >
                                        <X className="w-4 h-4" /> REJECT
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DeliveryPartners;
