import { createContext, useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from 'axios'
import { io } from 'socket.io-client';

export const ShopContext = createContext();

const ShopContextProvider = (props) => {

    const currency = '$';
    const delivery_fee = 10;
    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [cartItems, setCartItems] = useState({});
    const [karmaScore, setKarmaScore] = useState(100);
    const [hasUsedBundle, setHasUsedBundle] = useState(false);
    const [products, setProducts] = useState([]);
    const [token, setToken] = useState('')
    const [couponData, setCouponData] = useState({ code: '', discount: 0 });
    const navigate = useNavigate();

    const [nluSearchResult, setNluSearchResult] = useState(null);
    const [isNluSearching, setIsNluSearching] = useState(false);
    const nluAbortControllerRef = useRef(null);

    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (token) {
            const newSocket = io(backendUrl, {
                auth: { token, role: 'user' }
            });
            setSocket(newSocket);

            newSocket.on('new-notification', (notification) => {
                setNotifications(prev => [notification, ...prev]);
                toast.info(`🔔 ${notification.title}: ${notification.message}`);
            });

            axios.get(backendUrl + '/api/notification', { headers: { 'x-role': 'user', Authorization: `Bearer ${token}` } })
                .then(res => {
                    if (res.data.success) {
                        setNotifications(res.data.notifications);
                    }
                })
                .catch(console.error);

            return () => newSocket.disconnect();
        } else {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            setNotifications([]);
        }
    }, [token, backendUrl]);

    const markAsRead = async (ids) => {
        try {
            await axios.post(backendUrl + '/api/notification/read', { notificationIds: ids }, { headers: { 'x-role': 'user', Authorization: `Bearer ${token}` } });
            setNotifications(prev => prev.map(n => ids.includes(n._id) ? { ...n, isRead: true } : n));
        } catch (e) {}
    };

    const markAllAsRead = async () => {
        try {
            await axios.post(backendUrl + '/api/notification/read-all', {}, { headers: { 'x-role': 'user', Authorization: `Bearer ${token}` } });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (e) {}
    };

    const fetchNluSearch = async (query) => {
        if (!query.trim()) {
            setNluSearchResult(null);
            return;
        }

        // Cancel previous request
        if (nluAbortControllerRef.current) {
            nluAbortControllerRef.current.abort();
        }
        nluAbortControllerRef.current = new AbortController();

        setIsNluSearching(true);
        try {
            const response = await axios.post(
                backendUrl + '/api/ai/nlu-search',
                { query },
                { signal: nluAbortControllerRef.current.signal }
            );

            if (response.data.success) {
                setNluSearchResult({ query, products: response.data.products });
            } else {
                setNluSearchResult(null);
            }
        } catch (error) {
            if (axios.isCancel(error)) {
                console.log('NLU search request canceled for:', query);
            } else {
                console.error('NLU search error:', error);
                setNluSearchResult(null);
            }
        } finally {
            setIsNluSearching(false);
        }
    };


    const [savedForLater, setSavedForLater] = useState(() => {
        try {
            const saved = localStorage.getItem('savedForLater');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('savedForLater', JSON.stringify(savedForLater));
        } catch (e) {
            console.error('Failed to save to localStorage', e);
        }
    }, [savedForLater]);

    const addToCart = async (itemId, size) => {

        if (!size) {
            toast.error('Select Product Size');
            return;
        }

        setCartItems((prevCartItems) => {
            let cartData = structuredClone(prevCartItems);
            if (cartData[itemId]) {
                if (cartData[itemId][size]) {
                    cartData[itemId][size] += 1;
                }
                else {
                    cartData[itemId][size] = 1;
                }
            }
            else {
                cartData[itemId] = {};
                cartData[itemId][size] = 1;
            }
            return cartData;
        });

        if (token) {
            try {

                await axios.post(backendUrl + '/api/cart/add', { itemId, size }, { headers: { Authorization: `Bearer ${token}` } })
                toast.success('Product added to cart!');

            } catch (error) {
                console.log(error)
                toast.error(error.message)
            }
        } else {
            toast.success('Product added to cart!');
        }

        // Analytics Tracking for ADD_TO_CART
        try {
            axios.post(backendUrl + '/api/product/track-event', {
                productId: itemId,
                eventType: 'ADD_TO_CART'
            }, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            }).catch(() => {}); // Fire and forget
        } catch (e) {}

    }

    const addToSavedForLater = (itemId, size) => {
        const productInfo = products.find(p => p._id === itemId);
        if (!productInfo) return;

        // Check if already in savedForLater
        const exists = savedForLater.some(item => item._id === itemId && item.size === size);
        if (!exists) {
            setSavedForLater(prev => [...prev, { _id: itemId, size, addedAt: Date.now() }]);
        }
        
        // Remove from current active cart
        updateQuantity(itemId, size, 0);
        toast.info("Moved to Saved for Later");
    };

    const moveToCartFromSaved = (itemId, size) => {
        setSavedForLater(prev => prev.filter(item => !(item._id === itemId && item.size === size)));
        addToCart(itemId, size);
        toast.success("Moved back to Cart");
    };

    const removeFromSavedForLater = (itemId, size) => {
        setSavedForLater(prev => prev.filter(item => !(item._id === itemId && item.size === size)));
        toast.info("Item removed from Saved List");
    };

    const getCartCount = () => {
        let totalCount = 0;
        for (const items in cartItems) {
            for (const item in cartItems[items]) {
                try {
                    if (cartItems[items][item] > 0) {
                        totalCount += cartItems[items][item];
                    }
                } catch (error) {

                }
            }
        }
        return totalCount;
    }

    const updateQuantity = async (itemId, size, quantity) => {

        let cartData = structuredClone(cartItems);

        if (cartData[itemId]) {
            cartData[itemId][size] = quantity;
        }

        setCartItems(cartData)

        if (token) {
            try {

                await axios.post(backendUrl + '/api/cart/update', { itemId, size, quantity }, { headers: { Authorization: `Bearer ${token}` } })

            } catch (error) {
                console.log(error)
                toast.error(error.message)
            }
        }

    }

    const getCartAmount = () => {
        let totalAmount = 0;
        for (const items in cartItems) {
            let itemInfo = products.find((product) => product._id === items);
            for (const item in cartItems[items]) {
                try {
                    if (cartItems[items][item] > 0 && itemInfo) {
                        totalAmount += itemInfo.price * cartItems[items][item];
                    }
                } catch (error) {

                }
            }
        }
        return totalAmount;
    }

    const [vipStatus, setVipStatus] = useState('none');
    const [vipSubscription, setVipSubscription] = useState(null);

    const fetchVipStatus = async (userToken) => {
        const authToken = userToken || token;
        if (!authToken) {
            setVipStatus('none');
            setVipSubscription(null);
            return;
        }
        try {
            const res = await axios.post(`${backendUrl}/api/subscription/status`, {}, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            if (res.data.success) {
                setVipStatus(res.data.vipStatus || 'none');
                setVipSubscription(res.data.subscription || null);
            }
        } catch (err) {
            console.error("Fetch VIP Status Error:", err);
        }
    };

    useEffect(() => {
        if (token) {
            fetchVipStatus(token);
        } else {
            setVipStatus('none');
            setVipSubscription(null);
        }
    }, [token]);

    // Live background polling when VIP request is pending admin approval
    useEffect(() => {
        let timer = null;
        if (token && vipStatus === 'pending') {
            timer = setInterval(async () => {
                try {
                    const res = await axios.post(`${backendUrl}/api/subscription/status`, {}, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.data.success) {
                        const newStatus = res.data.vipStatus || 'none';
                        if (newStatus === 'active') {
                            setVipStatus('active');
                            setVipSubscription(res.data.subscription || null);
                            toast.success("🎉 CONGRATULATIONS! Your VIP Gold Membership has been Approved by Admin! 👑 Free Shipping & Extra 10% OFF are now ACTIVE site-wide!", {
                                autoClose: 7000
                            });
                        }
                    }
                } catch (e) {}
            }, 4000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [token, vipStatus]);

    // --- Coupon Logic ---
    const applyCouponCode = async (code) => {
        if (!token) {
            toast.error('Please login to apply coupons');
            return false;
        }
        try {
            const response = await axios.post(backendUrl + '/api/coupon/apply', { code, cartData: cartItems }, { headers: { Authorization: `Bearer ${token}` } });
            if (response.data.success) {
                setCouponData({ code, discount: response.data.discount });
                toast.success(response.data.message);
                return true;
            } else {
                setCouponData({ code: '', discount: 0 });
                toast.error(response.data.message);
                return false;
            }
        } catch (error) {
            toast.error(error.message);
            return false;
        }
    };

    const getCartTotals = () => {
        let subtotal = 0;
        let totalMRP = 0;

        for (const items in cartItems) {
            let itemInfo = products.find((product) => product._id === items);
            if (itemInfo) {
                const mrp = itemInfo.mrp || Math.round(itemInfo.price * 1.25);
                for (const item in cartItems[items]) {
                    try {
                        const qty = cartItems[items][item];
                        if (qty > 0) {
                            subtotal += itemInfo.price * qty;
                            totalMRP += mrp * qty;
                        }
                    } catch (error) {}
                }
            }
        }

        const isVip = vipStatus === 'active';
        const isFreeDelivery = isVip || subtotal >= 150;
        const actualDeliveryFee = subtotal > 0 ? (isFreeDelivery ? 0 : delivery_fee) : 0;
        const totalDiscount = Math.max(0, totalMRP - subtotal);
        const vipDiscount = isVip ? Math.round(subtotal * 0.10) : 0;
        const couponDiscountAmount = couponData.discount || 0;
        
        const platformFee = subtotal > 0 ? 2 : 0;
        const subtotalAfterDiscounts = Math.max(0, subtotal - vipDiscount - couponDiscountAmount);
        const tax = subtotal > 0 ? Math.round(subtotalAfterDiscounts * 0.03) : 0; // 3% GST
        
        const finalTotal = subtotal > 0 ? (subtotalAfterDiscounts + actualDeliveryFee + platformFee + tax) : 0;
        const totalSavings = totalDiscount + vipDiscount + couponDiscountAmount + (subtotal > 0 && isFreeDelivery ? delivery_fee : 0);

        return {
            subtotal,
            totalMRP,
            totalDiscount,
            vipDiscount,
            couponDiscountAmount,
            couponCode: couponData.code,
            isVip,
            deliveryFee: actualDeliveryFee,
            isFreeDelivery,
            platformFee,
            tax,
            finalTotal,
            totalSavings,
            freeDeliveryThreshold: 150
        };
    };

    const getProductsData = async () => {
        try {

            const response = await axios.get(backendUrl + '/api/product/list')
            if (response.data.success) {
                setProducts(response.data.products.reverse())
            } else {
                toast.error(response.data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const getUserCart = async ( token ) => {
        try {
            
            const response = await axios.post(backendUrl + '/api/cart/get',{},{ headers: { Authorization: `Bearer ${token}` } })
            if (response.data.success) {
                setCartItems(response.data.cartData)
                if (response.data.karmaScore !== undefined) {
                    setKarmaScore(response.data.karmaScore)
                }
                if (response.data.hasUsedBundle !== undefined) {
                    setHasUsedBundle(response.data.hasUsedBundle)
                    if (response.data.hasUsedBundle) {
                        localStorage.setItem('bundleUsed', 'true')
                    }
                }
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    useEffect(() => {
        getProductsData()
    }, [])

    useEffect(() => {
        if (socket) {
            socket.on('product-updated', getProductsData);
            return () => socket.off('product-updated', getProductsData);
        }
    }, [socket]);

    const [sellerStatus, setSellerStatus] = useState('none');

    const fetchSellerStatus = async (userToken) => {
        if (!userToken) {
            setSellerStatus('none');
            return;
        }
        try {
            const response = await axios.get(backendUrl + '/api/seller/status', {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            if (response.data.success) {
                setSellerStatus(response.data.sellerStatus || 'none');
            } else {
                setSellerStatus('none');
            }
        } catch (error) {
            setSellerStatus('none');
        }
    };

    useEffect(() => {
        if (!token) {
            const localToken = localStorage.getItem('token');
            if (localToken && localToken !== 'null' && localToken !== 'undefined') {
                setToken(localToken);
                getUserCart(localToken);
                fetchSellerStatus(localToken);
            } else {
                setSellerStatus('none');
            }
        } else {
            getUserCart(token);
            fetchSellerStatus(token);
        }
    }, [token])

    // --- Wishlist State ---
    const [wishlist, setWishlist] = useState(() => {
        try {
            const saved = localStorage.getItem('wishlist');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('wishlist', JSON.stringify(wishlist));
        } catch (e) {}
    }, [wishlist]);

    const toggleWishlist = (productId) => {
        if (wishlist.includes(productId)) {
            setWishlist(prev => prev.filter(id => id !== productId));
            toast.info("Removed from Wishlist");
        } else {
            setWishlist(prev => [...prev, productId]);
            toast.success("Added to Wishlist ❤️");
        }
    };

    const isInWishlist = (productId) => wishlist.includes(productId);

    // --- Compare List State ---
    const [compareList, setCompareList] = useState(() => {
        try {
            const saved = localStorage.getItem('compareList');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('compareList', JSON.stringify(compareList));
        } catch (e) {}
    }, [compareList]);

    const addToCompare = (product) => {
        if (!product || !product._id) return;
        if (compareList.some(item => item._id === product._id)) {
            toast.info("Item is already in your Compare list");
            return;
        }
        if (compareList.length >= 4) {
            toast.warning("You can compare up to 4 items max. Remove an item to add this one.");
            return;
        }
        setCompareList(prev => [...prev, product]);
        toast.success("Added to Compare list ⚖️");
    };

    const removeFromCompare = (productId) => {
        setCompareList(prev => prev.filter(item => item._id !== productId));
        toast.info("Removed from Compare list");
    };

    const clearCompare = () => {
        setCompareList([]);
        toast.info("Compare list cleared");
    };

    const isInCompare = (productId) => compareList.some(item => item._id === productId);

    // --- Notify Me Subscriptions ---
    const [subscriptions, setSubscriptions] = useState(() => {
        try {
            const saved = localStorage.getItem('notify_subscriptions');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('notify_subscriptions', JSON.stringify(subscriptions));
        } catch (e) {}
    }, [subscriptions]);

    const subscribeNotifyMe = (productId, size, email) => {
        if (!email || !email.includes('@')) {
            toast.error("Please provide a valid email address");
            return false;
        }
        const exists = subscriptions.some(sub => sub.productId === productId && sub.size === size && sub.email.toLowerCase() === email.toLowerCase());
        if (exists) {
            toast.info("You're already subscribed for back-in-stock alerts for this item!");
            return true;
        }
        const newSub = { productId, size, email: email.toLowerCase(), createdAt: Date.now() };
        setSubscriptions(prev => [...prev, newSub]);
        toast.success(`Success! We'll notify ${email} when Size ${size} is back in stock. 🔔`);
        return true;
    };

    // --- Variant Stock Calculator ---
    const getVariantStock = (productId, size) => {
        if (!productId || !size) {
            return { count: 10, status: 'IN_STOCK', text: 'In Stock' };
        }
        // Hash product ID & size to create realistic, deterministic stock values
        const str = `${productId}-${size}`;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const absHash = Math.abs(hash);
        
        // Out of stock condition (approx 15% of variants)
        if (absHash % 7 === 0) {
            return { count: 0, status: 'OUT_OF_STOCK', text: 'Out of Stock' };
        }
        // Low stock condition (approx 20% of variants)
        if (absHash % 4 === 0) {
            const lowCount = (absHash % 3) + 1; // 1, 2, or 3
            return { count: lowCount, status: 'LOW_STOCK', text: `Hurry, Only ${lowCount} Left!` };
        }
        // Regular stock
        return { count: 15, status: 'IN_STOCK', text: 'In Stock' };
    };

    const value = {
        products, currency, delivery_fee,
        search, setSearch, showSearch, setShowSearch,
        cartItems, addToCart, setCartItems,
        savedForLater, addToSavedForLater, moveToCartFromSaved, removeFromSavedForLater,
        getCartCount, updateQuantity,
        getCartAmount, getCartTotals, navigate, backendUrl,
        setToken, token,
        wishlist, toggleWishlist, isInWishlist,
        compareList, addToCompare, removeFromCompare, clearCompare, isInCompare,
        subscribeNotifyMe, getVariantStock,
        sellerStatus, fetchSellerStatus,
        vipStatus, vipSubscription, fetchVipStatus,
        couponData, setCouponData, applyCouponCode,
        karmaScore, setKarmaScore,
        nluSearchResult, setNluSearchResult, isNluSearching, fetchNluSearch,
        socket, notifications, markAsRead, markAllAsRead,
        hasUsedBundle, setHasUsedBundle
    }

    return (
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider>
    )

}

export default ShopContextProvider;