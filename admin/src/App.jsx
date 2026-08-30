import React, { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Add from './pages/Add'
import List from './pages/List'
import Orders from './pages/Orders'
import Reviews from './pages/Reviews'
import Sellers from './pages/Sellers'
import DeliveryPartners from './pages/DeliveryPartners'
import ProductApprovals from './pages/ProductApprovals'
import TrendingManagement from './pages/TrendingManagement'
import BankOffers from './pages/BankOffers'
import Subscriptions from './pages/Subscriptions'
import FlashSaleManager from './pages/FlashSaleManager'
import SubAdmins from './pages/SubAdmins'
import Coupons from './pages/Coupons'
import Finances from './pages/Finances'
import Analytics from './pages/Analytics'
import Stories from './pages/Stories'
import AddVideo from './pages/AddVideo'
import ManageVideos from './pages/ManageVideos'
import GlobalSettings from './pages/Settings'
import Login from './components/Login'
import { SocketProvider } from './context/SocketContext'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const backendUrl = import.meta.env.VITE_BACKEND_URL
export const currency = '$'

const App = () => {

  const [token, setToken] = useState(localStorage.getItem('token') ? localStorage.getItem('token') : '');
  const [role, setRole] = useState(localStorage.getItem('role') ? localStorage.getItem('role') : (localStorage.getItem('token') ? 'super_admin' : ''));

  useEffect(() => {
    localStorage.setItem('token', token)
    localStorage.setItem('role', role)
  }, [token, role])

  return (
    <div className='bg-slate-50 h-screen overflow-hidden text-slate-900 selection:bg-indigo-500 selection:text-white flex flex-col'>
      <ToastContainer position="top-right" autoClose={3000} />
      {token === ""
        ? <Login setToken={setToken} setRole={setRole} />
        : <SocketProvider token={token} role={role}>
          {/* Navbar remains at the top, non-scrolling */}
          <div className="shrink-0">
            <Navbar setToken={setToken} setRole={setRole} role={role} />
          </div>
          
          {/* Main flex container takes remaining height */}
          <div className='flex w-full flex-1 overflow-hidden'>
            {/* Sidebar component now handles its own styles and scroll */}
            <Sidebar role={role} />

            {/* Main content area scrolls independently */}
            <main className='flex-1 h-full overflow-y-auto overflow-x-hidden bg-slate-50 custom-scrollbar'>
              <div className='max-w-[1400px] mx-auto px-4 sm:px-8 py-6 w-full'>
                <Routes>
                  <Route path='/' element={<Dashboard token={token} />} />
                  <Route path='/dashboard' element={<Dashboard token={token} />} />
                  <Route path='/flash-sale' element={<FlashSaleManager token={token} />} />
                  <Route path='/trending' element={<TrendingManagement token={token} />} />
                  <Route path='/bank-offers' element={<BankOffers token={token} />} />
                  <Route path='/subscriptions' element={<Subscriptions token={token} />} />
                  <Route path='/add' element={<Add token={token} />} />
                  <Route path='/list' element={<List token={token} />} />
                  <Route path='/orders' element={<Orders token={token} />} />
                  <Route path='/reviews' element={<Reviews token={token} />} />
                  <Route path='/sellers' element={<Sellers token={token} />} />
                  <Route path='/delivery-partners' element={<DeliveryPartners token={token} />} />
                  <Route path='/product-approvals' element={<ProductApprovals token={token} />} />
                  <Route path='/sub-admins' element={<SubAdmins token={token} />} />
                  <Route path='/coupons' element={<Coupons token={token} />} />
                  <Route path='/finances' element={<Finances token={token} role={role} />} />
                  <Route path='/analytics' element={<Analytics token={token} />} />
                  <Route path='/stories' element={<Stories token={token} />} />
                  <Route path='/add-video' element={<AddVideo token={token} />} />
                  <Route path='/manage-videos' element={<ManageVideos token={token} />} />
                  <Route path='/settings' element={<GlobalSettings token={token} role={role} />} />
                </Routes>
              </div>
            </main>
          </div>
        </SocketProvider>
      }
    </div>
  )
}

export default App