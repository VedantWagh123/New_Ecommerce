import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import PendingApproval from './components/PendingApproval';
import RejectedScreen from './components/RejectedScreen';
import { SocketProvider } from './context/SocketContext';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Earnings from './pages/Earnings';
import Settings from './pages/Settings';

export const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
export const currency = '₹';

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('delivery_token') || '');
  const [deliveryStatus, setDeliveryStatus] = useState('loading'); // 'loading' | 'pending' | 'approved' | 'rejected' | 'none'
  const [partnerInfo, setPartnerInfo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Handle SSO Token from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ssoToken = params.get('sso_token');
    if (ssoToken) {
      localStorage.setItem('delivery_token', ssoToken);
      setToken(ssoToken);
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  const checkStatus = async () => {
    if (!token) {
      setDeliveryStatus('none');
      return;
    }

    try {
      const response = await axios.get(`${backendUrl}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const user = response.data.user;
        setDeliveryStatus(user.deliveryStatus || 'none');
        setPartnerInfo({
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          vehicle: user.deliveryVehicle,
          city: user.serviceCity,
          isOnline: user.isDeliveryOnline || false
        });
      } else {
        localStorage.removeItem('delivery_token');
        setToken('');
        setDeliveryStatus('none');
      }
    } catch (error) {
      console.error("Status Check Error:", error);
      localStorage.removeItem('delivery_token');
      setToken('');
      setDeliveryStatus('none');
    }
  };

  useEffect(() => {
    checkStatus();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('delivery_token');
    setToken('');
    setDeliveryStatus('none');
  };

  if (deliveryStatus === 'loading' && token) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium text-sm animate-pulse">Authenticating...</p>
      </div>
    );
  }

  if (!token || deliveryStatus === 'none') {
    return (
      <div className="min-h-screen bg-slate-50">
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          <Route path="/login" element={<Login setToken={setToken} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    );
  }

  if (deliveryStatus === 'pending') {
    return (
      <div className="min-h-screen bg-slate-50">
        <ToastContainer position="top-right" autoClose={3000} />
        <PendingApproval
          storeInfo={partnerInfo}
          onCheckStatus={checkStatus}
          onLogout={handleLogout}
        />
      </div>
    );
  }

  if (deliveryStatus === 'rejected') {
    return (
      <div className="min-h-screen bg-slate-50">
        <ToastContainer position="top-right" autoClose={3000} />
        <RejectedScreen
          storeInfo={partnerInfo}
          rejectionReason="Your application did not meet criteria."
          onLogout={handleLogout}
        />
      </div>
    );
  }

  return (
    <SocketProvider token={token} role="delivery">
      <div className="h-screen bg-slate-50 flex overflow-hidden">
        <ToastContainer position="top-right" autoClose={3000} />
        
        {/* Left Sidebar (Desktop) & Offcanvas (Mobile) */}
        <div className={`fixed inset-0 bg-slate-900/50 z-20 transition-opacity md:hidden ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setSidebarOpen(false)}></div>
        <div className={`fixed inset-y-0 left-0 z-30 transform transition-transform md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar setToken={setToken} storeInfo={partnerInfo} setSidebarOpen={setSidebarOpen} />
        </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full w-full">
        <Navbar
          storeInfo={partnerInfo}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setSidebarOpen={setSidebarOpen}
        />

        <main className="flex-1 overflow-y-auto bg-slate-50 custom-scrollbar relative">
          <Routes>
            <Route path="/" element={<Dashboard token={token} searchQuery={searchQuery} />} />
            <Route path="/orders" element={<Orders token={token} searchQuery={searchQuery} />} />
            <Route path="/earnings" element={<Earnings token={token} />} />
            <Route path="/settings" element={<Settings token={token} setToken={setToken} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
    </SocketProvider>
  );
};

export default App;
