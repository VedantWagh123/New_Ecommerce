import React, { useState, useEffect } from 'react';
import { ALL_STATUSES, STATUS_STEPS, getStatusStepIndex, getStatusBadgeStyle } from '../utils/orderStatus';

const AdminOrderModal = ({ isOpen, onClose, order, currency = '$', onStatusUpdate, onDeleteOrder, wishmasters = [], onAssignWishmaster }) => {
    if (!isOpen || !order) return null;

    const {
        _id,
        items = [],
        amount = 0,
        address = {},
        status = 'Packing',
        statusHistory = [],
        paymentMethod = 'COD',
        payment = false,
        date = Date.now()
    } = order;

    const [selectedStatus, setSelectedStatus] = useState(status);
    const [note, setNote] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedPartnerId, setSelectedPartnerId] = useState('');

    useEffect(() => {
        setSelectedStatus(status);
        setNote('');
    }, [order, status]);

    const currentStepIndex = getStatusStepIndex(status);

    const handleConfirmSubmit = async () => {
        setShowConfirmModal(false);
        setIsUpdating(true);
        try {
            await onStatusUpdate(_id, selectedStatus, note);
            setNote('');
        } catch (error) {
            console.error('Failed to update order status:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handlePrintSummary = () => {
        window.print();
    };

    const handleAssignWishmaster = async () => {
        if (!selectedPartnerId) return;
        setIsUpdating(true);
        try {
            await onAssignWishmaster(_id, selectedPartnerId);
            setSelectedPartnerId('');
        } catch (error) {
            console.error('Failed to assign wishmaster:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-gray-900/20 animate-fade-in overflow-y-auto print:absolute print:inset-auto print:bg-white print:p-0 print:overflow-visible print:h-auto print:block">
            
            {/* Printable Invoice Section (Only visible when printing) */}
            <div className="hidden print:block print-invoice-section bg-white p-10 w-full font-sans text-gray-900 absolute top-0 left-0 min-h-screen z-[99999]">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-gray-200 pb-8 mb-8">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tighter">INVOICE</h1>
                        <p className="text-gray-500 mt-2 font-medium">Order ID: #{_id?.slice(-8)?.toUpperCase()}</p>
                        <p className="text-gray-500 font-medium">Date: {new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl font-bold text-gray-900">Veloura Official</h2>
                        <p className="text-gray-500 text-sm mt-1">contact@veloura.com</p>
                        <p className="text-gray-500 text-sm">123 Fashion Street, NY 10001</p>
                    </div>
                </div>

                {/* Customer Info */}
                <div className="flex justify-between mb-10">
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Billed To:</h3>
                        <p className="font-bold text-lg">{address.firstName} {address.lastName}</p>
                        <p className="text-gray-600 mt-1">{address.email}</p>
                        <p className="text-gray-600">{address.phone}</p>
                        <p className="text-gray-600 max-w-xs leading-relaxed mt-1">
                            {address.street}, {address.city}, {address.state} {address.zipcode}, {address.country}
                        </p>
                    </div>
                    <div className="text-right">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Payment Details:</h3>
                        <p className="font-medium text-gray-800">Method: <span className="font-bold uppercase">{paymentMethod}</span></p>
                        <p className="font-medium text-gray-800 mt-1">Status: <span className="font-bold">{payment ? 'Paid' : 'Pending'}</span></p>
                        <p className="font-medium text-gray-800 mt-1">Order Status: <span className="font-bold">{status}</span></p>
                    </div>
                </div>

                {/* Order Items Table */}
                <table className="w-full text-left mb-10 border-collapse">
                    <thead>
                        <tr className="border-b-2 border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                            <th className="py-3 px-4 font-bold">Item Description</th>
                            <th className="py-3 px-4 font-bold text-center">Size</th>
                            <th className="py-3 px-4 font-bold text-center">Qty</th>
                            <th className="py-3 px-4 font-bold text-right">Price</th>
                            <th className="py-3 px-4 font-bold text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {items.map((item, idx) => (
                            <tr key={idx} className="text-sm">
                                <td className="py-4 px-4 font-medium text-gray-900">
                                    {item.name}
                                    {item.storeName && <p className="text-xs text-gray-500 mt-0.5 font-normal">Sold by: {item.storeName}</p>}
                                </td>
                                <td className="py-4 px-4 text-center text-gray-600 uppercase">{item.size}</td>
                                <td className="py-4 px-4 text-center text-gray-900 font-bold">{item.quantity}</td>
                                <td className="py-4 px-4 text-right text-gray-600">{currency}{item.price?.toFixed(2)}</td>
                                <td className="py-4 px-4 text-right text-gray-900 font-bold">{currency}{(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals Section */}
                <div className="flex justify-end border-t-2 border-gray-200 pt-6">
                    <div className="w-1/3 min-w-[200px]">
                        <div className="flex justify-between py-3 text-lg font-black text-gray-900">
                            <span>Total Amount</span>
                            <span>{currency}{amount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-16 text-center text-gray-400 text-sm border-t border-gray-100 pt-8">
                    <p className="font-medium text-gray-600 mb-1">Thank you for your business!</p>
                    <p>If you have any questions about this invoice, please contact support.</p>
                </div>
            </div>

            <div 
                className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 my-auto print:hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="p-5 sm:p-6 bg-gray-50/90 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                                Order Summary #{_id?.slice(-8)?.toUpperCase() || _id}
                            </h2>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeStyle(status)}`}>
                                {status}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 font-medium">
                            Placed on {new Date(date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {onDeleteOrder && (
                            <button
                                onClick={() => {
                                    if (window.confirm(`Are you sure you want to permanently delete order #${_id?.slice(-8)?.toUpperCase()}?`)) {
                                        onDeleteOrder(_id);
                                        onClose();
                                    }
                                }}
                                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                                title="Delete order permanently"
                            >
                                <span>🗑️</span> Delete
                            </button>
                        )}
                        <button
                            onClick={handlePrintSummary}
                            className="px-3 py-1.5 rounded-xl bg-white border border-gray-300 hover:bg-gray-100 text-xs font-semibold text-gray-700 transition-colors shadow-2xs flex items-center gap-1.5"
                            title="Print Order Receipt"
                        >
                            <span>🖨️</span> Print Invoice
                        </button>
                        <button 
                            onClick={onClose}
                            className="w-9 h-9 rounded-full bg-white hover:bg-gray-200 border border-gray-200 flex items-center justify-center text-gray-600 transition-colors shadow-2xs"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-white">
                    {/* Shipping Address & Financial Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border border-gray-200/80 rounded-2xl bg-gray-50/50 text-xs text-gray-700 space-y-1.5">
                            <h4 className="font-bold text-gray-900 uppercase tracking-wider mb-2 text-[11px]">Shipping & Customer Details</h4>
                            <p className="font-bold text-sm text-gray-900">{address.firstName} {address.lastName}</p>
                            <p className="text-gray-600">📧 {address.email}</p>
                            <p className="text-gray-600">📞 {address.phone}</p>
                            <p className="pt-1.5 text-gray-700 leading-relaxed font-medium">
                                🏠 {address.street}, {address.city}, {address.state} {address.zipcode}, {address.country}
                            </p>
                        </div>

                        <div className="p-4 border border-gray-200/80 rounded-2xl bg-gray-50/50 text-xs text-gray-700 space-y-2.5">
                            <h4 className="font-bold text-gray-900 uppercase tracking-wider mb-2 text-[11px]">Financial Summary</h4>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Payment Method</span>
                                <span className="font-bold text-gray-900 uppercase">{paymentMethod}</span>
                            </div>
                            <div className="flex justify-between mt-1 items-center">
                                <span className="text-gray-500">Payment Status</span>
                                <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${payment ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                    {paymentMethod === 'COD' ? (payment ? 'COD Collected' : 'COD Pending') : (payment ? 'Paid' : 'Pending')}
                                </span>
                            </div>
                            {paymentMethod === 'COD' && order.codReceipt && order.codReceipt.status === 'Collected' && (
                                <div className="mt-2 p-2 bg-emerald-50 rounded-lg border border-emerald-100 text-[10px]">
                                    <p className="font-bold text-emerald-800 mb-1">COD Receipt:</p>
                                    <p className="text-emerald-700">Method: {order.codReceipt.method}</p>
                                    <p className="text-emerald-700">Amount: {currency}{order.codReceipt.amount}</p>
                                    <p className="text-emerald-700">Time: {new Date(order.codReceipt.collectedAt).toLocaleString()}</p>
                                </div>
                            )}
                            <div className="border-t pt-2 flex justify-between text-sm font-black text-gray-900">
                                <span>Total Amount Paid</span>
                                <span>{currency}{amount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Order Product Items */}
                    <div className="border border-gray-200/80 rounded-2xl p-4 bg-white">
                        <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-3">Purchased Items ({items.length})</h4>
                        <div className="divide-y divide-gray-100">
                            {items.map((item, idx) => (
                                <div key={idx} className="py-3 flex items-center justify-between text-xs first:pt-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <img className="w-12 h-14 object-cover rounded-xl bg-gray-50 border border-gray-200" src={item.image?.[0]} alt="" />
                                        <div>
                                            <p className="font-bold text-gray-900 line-clamp-1">{item.name}</p>
                                            <div className="flex items-center gap-2 mt-1 text-[11px] flex-wrap">
                                                <span className="text-gray-500">Size: <b className="text-black uppercase bg-gray-100 px-1.5 py-0.5 rounded">{item.size}</b></span>
                                                <span className="text-gray-500">Qty: <b>{item.quantity}</b></span>
                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-800 font-bold rounded-full border border-blue-200 flex items-center gap-1">
                                                    <span>🏪</span> {item.storeName || 'Veloura Official'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="font-black text-gray-900 text-sm">{currency}{(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Status Update Action Control */}
                    <div className="p-4 sm:p-5 bg-gray-50 border border-gray-200/90 rounded-2xl space-y-3">
                        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Fulfillment Status Management</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                            <div className="sm:col-span-5">
                                <label className="text-xs text-gray-500 block mb-1 font-semibold">Target Status</label>
                                {['Packing', 'Accepted'].includes(status) ? (
                                    <div className="w-full border border-gray-200 bg-gray-50 rounded-xl p-2.5 text-xs font-bold text-gray-500 text-center uppercase tracking-wider">
                                        Pending Seller Acceptance
                                    </div>
                                ) : status === 'Ready for Pickup' || status === 'Assigned' || order.returnStatus === 'Approved' ? (
                                    <div className="space-y-2">
                                        {order.returnStatus === 'Approved' && (
                                            <p className="text-[10px] text-amber-600 font-bold mb-1">Assign Wishmaster for Reverse Pickup</p>
                                        )}
                                        <select
                                            value={selectedPartnerId || order.deliveryPartnerId || ''}
                                            onChange={(e) => setSelectedPartnerId(e.target.value)}
                                            className="w-full border border-gray-300 rounded-xl p-2.5 text-xs font-bold focus:ring-2 focus:ring-black bg-white cursor-pointer"
                                        >
                                            <option value="" disabled>Select Wishmaster to Assign...</option>
                                            {wishmasters.map(partner => (
                                                <option key={partner._id} value={partner._id} disabled={!partner.isDeliveryOnline}>
                                                    {partner.name} - {partner.deliveryVehicle} ({partner.serviceCity}) - {partner.isDeliveryOnline ? '🟢 Online' : '🔴 Offline'}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            disabled={isUpdating || !selectedPartnerId || selectedPartnerId === order.deliveryPartnerId}
                                            onClick={handleAssignWishmaster}
                                            className={`w-full px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                                                isUpdating || !selectedPartnerId || selectedPartnerId === order.deliveryPartnerId
                                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                    : 'bg-black hover:bg-gray-800 text-white cursor-pointer'
                                            }`}
                                        >
                                            {status === 'Assigned' ? 'Reassign Wishmaster' : 'Assign Wishmaster'}
                                        </button>
                                    </div>
                                ) : ['Assigned', 'Accepted (Delivery)', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'].includes(status) ? (
                                    <div className="flex flex-col gap-2 w-full">
                                        <div className="w-full border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-xl p-2.5 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                                            <span>✅</span> {status}
                                        </div>
                                        <div className="flex gap-2">
                                            {status === 'Delivered' && (
                                                <button onClick={() => { setSelectedStatus('Returned'); onStatusUpdate(_id, 'Returned', note); }} className="flex-1 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-bold transition-colors">Mark Returned</button>
                                            )}
                                            <button onClick={() => { setSelectedStatus('Cancelled'); onStatusUpdate(_id, 'Cancelled', note); }} className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold transition-colors">Cancel Order</button>
                                        </div>
                                    </div>
                                ) : (
                                    <select
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                        disabled={order.cancelStatus === 'Requested'}
                                        className="w-full border border-gray-300 rounded-xl p-2.5 text-xs font-bold focus:ring-2 focus:ring-black bg-white cursor-pointer disabled:opacity-50"
                                    >
                                        <option value={status}>{status}</option>
                                        {['Packed', 'Ready for Pickup', 'Assigned', 'Accepted (Delivery)', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered', 'Returned', 'Cancelled']
                                          .slice(['Packed', 'Ready for Pickup', 'Assigned', 'Accepted (Delivery)', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered', 'Returned', 'Cancelled'].indexOf(status) + 1)
                                          .map((st) => (
                                            <option key={st} value={st}>
                                                {st}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                {order.cancelStatus === 'Requested' && (
                                    <p className="text-[10px] text-rose-600 font-bold mt-1">Pending cancellation request.</p>
                                )}
                            </div>
                            <div className="sm:col-span-7">
                                <label className="text-xs text-gray-500 block mb-1 font-semibold">Courier Tracking Note / AWB Number (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Handed over to BlueDart courier AWB #92019"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    className="w-full border border-gray-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-black bg-white"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-1">
                            <button
                                type="button"
                                disabled={isUpdating || (selectedStatus === status && !note)}
                                onClick={() => setShowConfirmModal(true)}
                                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                                    isUpdating || (selectedStatus === status && !note)
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer active:scale-95'
                                }`}
                            >
                                {isUpdating ? 'Updating Status...' : 'Apply Status Update'}
                            </button>
                        </div>
                    </div>

                    {/* Progress Stepper View */}
                    <div className="p-4 sm:p-5 bg-white border border-gray-200/80 rounded-2xl shadow-2xs">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Customer Stepper Progress View</h3>
                        <div className="flex items-center justify-between relative px-2">
                            <div className="absolute top-4 left-6 right-6 h-1 bg-gray-200 -z-0" />
                            <div 
                                className="absolute top-4 left-6 h-1 bg-emerald-500 transition-all duration-500 -z-0"
                                style={{ width: `${Math.max(0, Math.min(100, (currentStepIndex / (STATUS_STEPS.length - 1)) * 92))}%` }}
                            />
                            {STATUS_STEPS.map((stepName, idx) => {
                                const isDeliveredStep = stepName === 'Delivered';
                                const isPassed = currentStepIndex > idx || (isDeliveredStep && currentStepIndex === idx);
                                const isCurrent = currentStepIndex === idx && !isDeliveredStep;

                                return (
                                    <div key={stepName} className="flex flex-col items-center relative z-10 w-20 text-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-transform ${
                                            isPassed 
                                                ? 'bg-emerald-500 text-white shadow-xs' 
                                                : isCurrent 
                                                ? 'bg-white text-indigo-600 border-2 border-indigo-500 ring-4 ring-indigo-50 scale-110 shadow-md animate-pulse' 
                                                : 'bg-white border-2 border-gray-300 text-gray-400'
                                        }`}>
                                            {isPassed ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg> : idx + 1}
                                        </div>
                                        <span className={`text-[11px] mt-2 font-bold ${isCurrent ? 'text-indigo-700' : isPassed ? 'text-emerald-700' : 'text-gray-400'}`}>
                                            {stepName}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Status History Audit Log */}
                    {statusHistory && statusHistory.length > 0 && (
                        <div className="border border-gray-200/80 rounded-2xl p-4 bg-white">
                            <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-3">Status Audit History ({statusHistory.length})</h4>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {statusHistory.map((h, i) => (
                                    <div key={i} className="text-xs p-3 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-start">
                                        <div>
                                            <span className="font-bold text-gray-900">{h.status}</span>
                                            <span className="text-gray-400 text-[11px] ml-2">by {h.updatedBy || 'Admin'}</span>
                                            {h.note && <p className="text-gray-600 mt-1 italic">"{h.note}"</p>}
                                        </div>
                                        <span className="text-[11px] text-gray-400 font-mono shrink-0 ml-2">
                                            {new Date(h.timestamp).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
                    <button
                        onClick={onClose}
                        className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold px-6 py-2.5 rounded-xl text-xs transition-colors shadow-xs"
                    >
                        Close Details
                    </button>
                </div>
            </div>

            {/* Confirmation Dialog Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-gray-100 animate-scale-up">
                        <h4 className="text-lg font-bold text-gray-900">Confirm Status Update?</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Update order <strong>#{_id?.slice(-8)?.toUpperCase()}</strong> status from <span className="font-bold text-black">{status}</span> to <span className="font-bold text-blue-600">{selectedStatus}</span>?
                        </p>
                        {note && (
                            <div className="p-3 bg-gray-50 rounded-xl border text-xs text-gray-600">
                                <strong>Tracking Note:</strong> "{note}"
                            </div>
                        )}
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmSubmit}
                                className="px-5 py-2.5 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-bold shadow-md active:scale-95"
                            >
                                Confirm Update
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOrderModal;
