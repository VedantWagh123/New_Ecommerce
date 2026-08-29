import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import PendingApproval from './components/PendingApproval';
import RejectedScreen from './components/RejectedScreen';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import TrendingRequests from './pages/TrendingRequests'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword';
import AddProduct from './pages/AddProduct';
import EditProduct from './pages/EditProduct';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';
import Analytics from './pages/Analytics';
import Earnings from './pages/Earnings';
import Reviews from './pages/Reviews';
import StoreProfile from './pages/StoreProfile';
import Settings from './pages/Settings';
import AddVideo from './pages/AddVideo';
import ManageVideos from './pages/ManageVideos';

export const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
export const currency = '$';

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('seller_token') || '');
  const [sellerStatus, setSellerStatus] = useState('loading'); // 'loading' | 'pending' | 'approved' | 'rejected' | 'none'
  const [rejectionReason, setRejectionReason] = useState('');
  const [storeInfo, setStoreInfo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle SSO Token from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ssoToken = params.get('sso_token');
    if (ssoToken) {
      localStorage.setItem('seller_token', ssoToken);
      setToken(ssoToken);
      // Remove token from URL for security
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  const checkStatus = async () => {
    if (!token) {
      setSellerStatus('none');
      return;
    }

    try {
      const response = await axios.get(`${backendUrl}/api/seller/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSellerStatus(response.data.sellerStatus || 'none');
        setRejectionReason(response.data.sellerRejectionReason || '');
        setStoreInfo({
          storeName: response.data.storeName,
          storeLogo: response.data.storeLogo,
          email: response.data.email,
          name: response.data.name
        });
      } else {
        // Token invalid or expired
        localStorage.removeItem('seller_token');
        setToken('');
        setSellerStatus('none');
      }
    } catch (error) {
      console.error("Status Check Error:", error);
      if (error.response?.data?.sellerStatus) {
        setSellerStatus(error.response.data.sellerStatus);
        setRejectionReason(error.response.data.sellerRejectionReason || '');
      } else {
        localStorage.removeItem('seller_token');
        setToken('');
        setSellerStatus('none');
      }
    }
  };

  useEffect(() => {
    checkStatus();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('seller_token');
    setToken('');
    setSellerStatus('none');
  };

  if (sellerStatus === 'loading' && token) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium text-sm animate-pulse">Authenticating...</p>
      </div>
    );
  }

  if (!token || sellerStatus === 'none') {
    return (
      <div className="min-h-screen bg-slate-50">
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          <Route path="/login" element={<Login setToken={setToken} setSellerStatus={setSellerStatus} setStoreInfo={setStoreInfo} />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    );
  }

  if (sellerStatus === 'pending') {
    return (
      <div className="min-h-screen bg-slate-50">
        <ToastContainer position="top-right" autoClose={3000} />
        <PendingApproval
          storeInfo={storeInfo}
          onCheckStatus={checkStatus}
          onLogout={handleLogout}
        />
      </div>
    );
  }

  if (sellerStatus === 'rejected') {
    return (
      <div className="min-h-screen bg-slate-50">
        <ToastContainer position="top-right" autoClose={3000} />
        <RejectedScreen
          storeInfo={storeInfo}
          rejectionReason={rejectionReason}
          onLogout={handleLogout}
        />
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Left Sidebar */}
      <Sidebar setToken={setToken} storeInfo={storeInfo} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <Navbar
          storeInfo={storeInfo}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <main className="flex-1 overflow-y-auto bg-slate-50 custom-scrollbar">
          <Routes>
            <Route path="/" element={<Dashboard token={token} searchQuery={searchQuery} />} />
            <Route path="/products" element={<Products token={token} searchQuery={searchQuery} />} />
            <Route path="/trending-requests" element={<TrendingRequests token={token} />} />
            <Route path="/add-product" element={<AddProduct token={token} />} />
            <Route path="/edit-product/:id" element={<EditProduct token={token} />} />
            <Route path="/orders" element={<Orders token={token} searchQuery={searchQuery} />} />
            <Route path="/inventory" element={<Inventory token={token} searchQuery={searchQuery} />} />
            <Route path="/analytics" element={<Analytics token={token} />} />
            <Route path="/earnings" element={<Earnings token={token} />} />
            <Route path="/reviews" element={<Reviews token={token} />} />
            <Route path="/store-profile" element={<StoreProfile token={token} setStoreInfo={setStoreInfo} />} />
            <Route path="/settings" element={<Settings token={token} setToken={setToken} />} />
            <Route path="/add-video" element={<AddVideo token={token} />} />
            <Route path="/manage-videos" element={<ManageVideos token={token} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;
