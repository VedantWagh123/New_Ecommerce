import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from './Title';

const CartTotal = () => {
    const { currency, getCartTotals } = useContext(ShopContext);
    const { subtotal, totalMRP, totalDiscount, vipDiscount, couponDiscountAmount, couponCode, isVip, deliveryFee, isFreeDelivery, platformFee, tax, finalTotal, totalSavings } = getCartTotals();

    return (
        <div className='w-full bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-3'>
            <div className='text-xl font-bold tracking-tight mb-2 border-b pb-3 flex items-center justify-between'>
                <Title text1={'PRICE'} text2={'DETAILS'} />
                {isVip ? (
                    <span className='text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-full flex items-center gap-1'>
                        👑 VIP GOLD MEMBER
                    </span>
                ) : (
                    <span className='text-xs font-semibold uppercase tracking-wider bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full'>
                        Summary
                    </span>
                )}
            </div>

            <div className='flex flex-col gap-3 text-sm text-gray-700'>
                <div className='flex justify-between items-center'>
                    <p className='text-gray-600'>Total MRP</p>
                    <p className='font-medium text-gray-900'>{currency}{totalMRP.toFixed(2)}</p>
                </div>
                
                {totalDiscount > 0 && (
                    <div className='flex justify-between items-center text-emerald-600'>
                        <p className='flex items-center gap-1.5'>
                            <span>Discount on MRP</span>
                        </p>
                        <p className='font-semibold'>- {currency}{totalDiscount.toFixed(2)}</p>
                    </div>
                )}

                {isVip && vipDiscount > 0 && (
                    <div className='flex justify-between items-center text-amber-700 font-bold bg-amber-50 p-2 rounded-lg border border-amber-200'>
                        <p className='flex items-center gap-1.5 text-xs'>
                            <span>👑 Extra VIP 10% Member Discount</span>
                        </p>
                        <p className='font-black'>- {currency}{vipDiscount.toFixed(2)}</p>
                    </div>
                )}

                {couponDiscountAmount > 0 && (
                    <div className='flex justify-between items-center text-indigo-700 font-bold bg-indigo-50 p-2 rounded-lg border border-indigo-200'>
                        <p className='flex items-center gap-1.5 text-xs'>
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                            <span className="uppercase">Coupon ({couponCode})</span>
                        </p>
                        <p className='font-black'>- {currency}{couponDiscountAmount.toFixed(2)}</p>
                    </div>
                )}

                <div className='flex justify-between items-center'>
                    <p className='text-gray-600 flex items-center gap-1'>
                        Delivery Charges
                        {isVip && <span className='text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded'>VIP Free</span>}
                    </p>
                    {isFreeDelivery ? (
                        <span className='text-emerald-600 font-semibold flex items-center gap-1'>
                            <span className='line-through text-gray-400 text-xs mr-1'>{currency}10.00</span>
                            FREE
                        </span>
                    ) : (
                        <p className='font-medium text-gray-900'>
                            {subtotal === 0 ? `${currency}0.00` : `${currency}${deliveryFee.toFixed(2)}`}
                        </p>
                    )}
                </div>

                {subtotal > 0 && (
                    <div className='flex justify-between items-center'>
                        <p className='text-gray-600'>Platform Fee</p>
                        <p className='font-medium text-gray-900'>{currency}{platformFee.toFixed(2)}</p>
                    </div>
                )}

                {subtotal > 0 && (
                    <div className='flex justify-between items-center'>
                        <p className='text-gray-600'>Estimated GST (3%)</p>
                        <p className='font-medium text-gray-900'>{currency}{tax.toFixed(2)}</p>
                    </div>
                )}

                <div className='border-t border-dashed my-1'></div>

                <div className='flex justify-between items-center text-base font-bold text-gray-900 pt-1'>
                    <p>Total Payable</p>
                    <p className='text-lg text-black'>{currency}{finalTotal.toFixed(2)}</p>
                </div>

                {totalSavings > 0 && subtotal > 0 && (
                    <div className='mt-2 p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-2 text-emerald-700 text-xs font-medium'>
                        <svg className="w-4 h-4 fill-current text-emerald-600 shrink-0" viewBox="0 0 20 20">
                            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                        </svg>
                        <span>You will save <strong>{currency}{totalSavings.toFixed(2)}</strong> on this order</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartTotal;
