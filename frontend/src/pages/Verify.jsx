import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import axios from 'axios'
import OrderSuccessModal from '../components/OrderSuccessModal'

const Verify = () => {

    const { navigate, token, setCartItems, backendUrl, currency, setCouponData } = useContext(ShopContext)
    const [searchParams] = useSearchParams()

    const success = searchParams.get('success')
    const orderId = searchParams.get('orderId')

    const [showModal, setShowModal] = useState(false)
    const [orderDetails, setOrderDetails] = useState(null)
    const [loading, setLoading] = useState(true)

    const verifyPayment = async () => {
        try {
            if (!token) return;

            const response = await axios.post(
                backendUrl + '/api/order/verifyStripe',
                { success, orderId },
                { headers: { Authorization: `Bearer ${token}` } }
            )

            if (response.data.success) {
                // Clear cart & coupon just like COD flow
                setCartItems({})
                setCouponData({ code: '', discount: 0 })

                // Fetch order details to populate the modal
                let details = {
                    orderId: `ORD-${Date.now()}`,
                    itemCount: 1,
                    totalAmount: 0,
                    currency: currency,
                    paymentMethod: 'Stripe Online',
                    deliveryEstimate: '3–5 business days',
                    address: {}
                };

                try {
                    const orderRes = await axios.post(
                        backendUrl + '/api/order/userorders',
                        {},
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    if (orderRes.data.success && orderRes.data.orders) {
                        const confirmedOrder = orderRes.data.orders.find(o => o._id === orderId);
                        if (confirmedOrder) {
                            details = {
                                orderId: confirmedOrder._id.slice(-10).toUpperCase(),
                                itemCount: confirmedOrder.items.reduce((sum, i) => sum + (i.quantity || 1), 0),
                                totalAmount: confirmedOrder.amount,
                                currency: currency,
                                paymentMethod: 'Stripe Online',
                                deliveryEstimate: '3–5 business days',
                                address: confirmedOrder.address || {}
                            };
                        }
                    }
                } catch (e) {
                    // Fallback to basic details if order fetch fails
                }

                setOrderDetails(details);
                setShowModal(true);
            } else {
                toast.error('Payment failed or was cancelled. Please try again.')
                navigate('/cart')
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
            navigate('/cart')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        verifyPayment()
    }, [token])

    const handleModalClose = () => {
        setShowModal(false)
        navigate('/orders')
    }

    if (loading) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
                <svg className="animate-spin h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-sm text-gray-500 font-medium">Verifying your payment...</p>
            </div>
        )
    }

    return (
        <div>
            <OrderSuccessModal
                isOpen={showModal}
                onClose={handleModalClose}
                orderDetails={orderDetails}
            />
        </div>
    )
}

export default Verify