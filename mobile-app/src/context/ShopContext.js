import React, { createContext, useEffect, useState } from "react";
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ShopContext = createContext();
export const backendUrl = 'http://10.178.32.4:4000'; // Your PC's local IP

const ShopContextProvider = (props) => {
    const currency = '$';
    const delivery_fee = 10;

    const [search, setSearch] = useState('');
    const [cartItems, setCartItems] = useState({});
    const [products, setProducts] = useState([]);
    const [token, setToken] = useState('');
    const [couponData, setCouponData] = useState({ code: '', discount: 0 });
    const [savedForLater, setSavedForLater] = useState([]);
    const [karmaScore, setKarmaScore] = useState(100);

    // Wishlist
    const [wishlist, setWishlist] = useState([]);

    // Compare List
    const [compareList, setCompareList] = useState([]);

    // Load everything from AsyncStorage on mount
    useEffect(() => {
        const init = async () => {
            try {
                const storedToken = await AsyncStorage.getItem('token');
                if (storedToken) setToken(storedToken);

                const storedWishlist = await AsyncStorage.getItem('wishlist');
                if (storedWishlist) setWishlist(JSON.parse(storedWishlist));

                const storedCompare = await AsyncStorage.getItem('compareList');
                if (storedCompare) setCompareList(JSON.parse(storedCompare));

                const storedSaved = await AsyncStorage.getItem('savedForLater');
                if (storedSaved) setSavedForLater(JSON.parse(storedSaved));

                const storedCart = await AsyncStorage.getItem('cartItems');
                if (storedCart) setCartItems(JSON.parse(storedCart));
            } catch (e) { console.error("AsyncStorage init error:", e); }
        };
        init();
        getProductsData();
    }, []);

    // Save token
    useEffect(() => {
        const saveToken = async () => {
            try {
                if (token) await AsyncStorage.setItem('token', token);
                else await AsyncStorage.removeItem('token');
            } catch (e) {}
        };
        saveToken();
    }, [token]);

    // Save wishlist
    useEffect(() => {
        AsyncStorage.setItem('wishlist', JSON.stringify(wishlist)).catch(() => {});
    }, [wishlist]);

    // Save compareList
    useEffect(() => {
        AsyncStorage.setItem('compareList', JSON.stringify(compareList)).catch(() => {});
    }, [compareList]);

    // Save savedForLater
    useEffect(() => {
        AsyncStorage.setItem('savedForLater', JSON.stringify(savedForLater)).catch(() => {});
    }, [savedForLater]);

    // Save cartItems locally so guest users don't lose cart
    useEffect(() => {
        AsyncStorage.setItem('cartItems', JSON.stringify(cartItems)).catch(() => {});
    }, [cartItems]);

    // Load cart when token changes
    useEffect(() => {
        if (token) getUserCart(token);
    }, [token]);

    const getProductsData = async () => {
        try {
            const response = await axios.get(backendUrl + '/api/product/list');
            if (response.data.success) {
                setProducts(response.data.products.reverse());
            }
        } catch (error) { console.error("Products fetch error:", error); }
    };

    const getUserCart = async (userToken) => {
        try {
            const response = await axios.post(backendUrl + '/api/cart/get', {}, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            if (response.data.success) {
                setCartItems(response.data.cartData);
                if (response.data.karmaScore !== undefined) {
                    setKarmaScore(response.data.karmaScore);
                }
            }
        } catch (error) { console.error("Cart fetch error:", error); }
    };

    const addToCart = async (itemId, size) => {
        if (!size) return { success: false, message: 'Select Product Size' };

        let cartData = structuredClone(cartItems);
        if (cartData[itemId]) {
            if (cartData[itemId][size]) cartData[itemId][size] += 1;
            else cartData[itemId][size] = 1;
        } else {
            cartData[itemId] = {};
            cartData[itemId][size] = 1;
        }
        setCartItems(cartData);

        if (token) {
            try {
                await axios.post(backendUrl + '/api/cart/add', { itemId, size }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (error) { console.log(error); }
        }
        return { success: true, message: 'Added to cart' };
    };

    const updateQuantity = async (itemId, size, quantity) => {
        let cartData = structuredClone(cartItems);
        if (cartData[itemId]) cartData[itemId][size] = quantity;
        setCartItems(cartData);

        if (token) {
            try {
                await axios.post(backendUrl + '/api/cart/update', { itemId, size, quantity }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (error) { console.log(error); }
        }
    };

    const getCartCount = () => {
        let totalCount = 0;
        for (const items in cartItems) {
            for (const item in cartItems[items]) {
                try { if (cartItems[items][item] > 0) totalCount += cartItems[items][item]; } catch (e) {}
            }
        }
        return totalCount;
    };

    const getCartAmount = () => {
        let totalAmount = 0;
        for (const items in cartItems) {
            let itemInfo = products.find(p => p._id === items);
            for (const item in cartItems[items]) {
                try {
                    if (cartItems[items][item] > 0 && itemInfo) {
                        totalAmount += itemInfo.price * cartItems[items][item];
                    }
                } catch (e) {}
            }
        }
        return totalAmount;
    };

    // Wishlist functions
    const toggleWishlist = (productId) => {
        if (wishlist.includes(productId)) {
            setWishlist(prev => prev.filter(id => id !== productId));
        } else {
            setWishlist(prev => [...prev, productId]);
        }
    };
    const isInWishlist = (productId) => wishlist.includes(productId);

    // Compare functions
    const addToCompare = (product) => {
        if (!product || !product._id) return { success: false, message: 'Invalid product' };
        if (compareList.some(item => item._id === product._id)) {
            return { success: false, message: 'Already in compare list' };
        }
        if (compareList.length >= 4) {
            return { success: false, message: 'Max 4 items can be compared. Remove one first.' };
        }
        setCompareList(prev => [...prev, product]);
        return { success: true, message: 'Added to compare list' };
    };
    const removeFromCompare = (productId) => {
        setCompareList(prev => prev.filter(item => item._id !== productId));
    };
    const clearCompare = () => setCompareList([]);
    const isInCompare = (productId) => compareList.some(item => item._id === productId);

    // Variant Stock Calculator (same deterministic logic as web)
    const getVariantStock = (productId, size) => {
        if (!productId || !size) return { count: 10, status: 'IN_STOCK', text: 'In Stock' };
        const str = `${productId}-${size}`;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const absHash = Math.abs(hash);
        if (absHash % 7 === 0) return { count: 0, status: 'OUT_OF_STOCK', text: 'Out of Stock' };
        if (absHash % 4 === 0) {
            const lowCount = (absHash % 3) + 1;
            return { count: lowCount, status: 'LOW_STOCK', text: `Only ${lowCount} Left!` };
        }
        return { count: 15, status: 'IN_STOCK', text: 'In Stock' };
    };

    // Apply Coupon
    const applyCouponCode = async (code) => {
        if (!token) return { success: false, message: 'Login to apply coupons' };
        try {
            const response = await axios.post(backendUrl + '/api/coupon/apply', { code, cartData: cartItems }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setCouponData({ code, discount: response.data.discount });
                return { success: true, message: response.data.message };
            } else {
                setCouponData({ code: '', discount: 0 });
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            return { success: false, message: 'Coupon apply failed' };
        }
    };

    const value = {
        products, currency, delivery_fee,
        search, setSearch,
        cartItems, addToCart, setCartItems,
        getCartCount, updateQuantity, getCartAmount,
        backendUrl, token, setToken,
        karmaScore, setKarmaScore,
        couponData, setCouponData, applyCouponCode,
        savedForLater, setSavedForLater,
        wishlist, toggleWishlist, isInWishlist,
        compareList, addToCompare, removeFromCompare, clearCompare, isInCompare,
        getVariantStock,
    };

    return (
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider>
    );
};

export default ShopContextProvider;
