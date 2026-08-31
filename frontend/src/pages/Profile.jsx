import React, { useContext, useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Title from '../components/Title'
import { ShopContext } from '../context/ShopContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Camera, Mail, Phone, MapPin, User, ArrowRight, ShieldCheck, Clock, XCircle, Store, Truck } from 'lucide-react'

const Profile = () => {
    const { token, sellerStatus, backendUrl, fetchSellerStatus, setHasAddress, addToCart } = useContext(ShopContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [highlightEdit, setHighlightEdit] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        houseNo: '',
        street: '',
        landmark: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
        addressType: 'Home'
    });

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState('');
    const [originalAvatar, setOriginalAvatar] = useState('');
    const fileInputRef = useRef(null);

    const [deliveryStatus, setDeliveryStatus] = useState('none');

    // Seller Application Modal State
    const [showSellerModal, setShowSellerModal] = useState(false);
    const [sellerForm, setSellerForm] = useState({
        storeName: '',
        storePhone: '',
        storeDescription: '',
        accountHolder: '',
        accountNumber: '',
        bankName: '',
        ifscCode: ''
    });
    const [applyingSeller, setApplyingSeller] = useState(false);

    // Delivery Partner Modal State
    const [showDeliveryModal, setShowDeliveryModal] = useState(false);
    const [deliveryForm, setDeliveryForm] = useState({
        vehicleDetails: '',
        drivingLicense: '',
        serviceCity: ''
    });
    const [applyingDelivery, setApplyingDelivery] = useState(false);

    const fetchUserProfile = async () => {
        if (!token) return;
        try {
            const response = await axios.get(backendUrl + '/api/user/profile', { headers: { Authorization: `Bearer ${token}` } });
            if (response.data.success) {
                const user = response.data.user;
                const addressObj = user.addresses?.[0] || {};
                
                const nameParts = (user.name || '').split(' ');
                const fName = nameParts[0] || '';
                const lName = nameParts.slice(1).join(' ') || '';

                setFormData({
                    firstName: fName,
                    lastName: lName,
                    email: user.email || '',
                    phone: user.phone || '',
                    houseNo: addressObj.houseNo || '',
                    street: addressObj.street || '',
                    landmark: addressObj.landmark || '',
                    city: addressObj.city || '',
                    state: addressObj.state || '',
                    pincode: addressObj.pincode || '',
                    country: addressObj.country || 'India',
                    addressType: addressObj.addressType || 'Home',
                });
                setAvatarPreview(user.avatar || '');
                setOriginalAvatar(user.avatar || '');
                setDeliveryStatus(user.deliveryStatus || 'none');
            } else {
                toast.error(response.data.message);
                // If token is expired or invalid, auto-logout
                if (response.data.message.toLowerCase().includes('not authorized') || response.data.message.toLowerCase().includes('login')) {
                    localStorage.removeItem('token');
                    window.location.href = '/login'; // Force redirect to clear state
                }
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load profile');
            if (error.response?.data?.message?.toLowerCase().includes('not authorized') || error.response?.data?.message?.toLowerCase().includes('login')) {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        }
    };

    useEffect(() => {
        fetchUserProfile();
    }, [token, backendUrl]);

    useEffect(() => {
        if (location.state?.focusEdit) {
            setIsEditing(true);
            setHighlightEdit(true);
            
            setTimeout(() => {
                window.scrollTo({ top: 300, behavior: 'smooth' });
                setTimeout(() => setHighlightEdit(false), 2000);
            }, 500);
            
            window.history.replaceState({}, document.title)
        }
    }, [location]);

    const onChangeHandler = (e) => {
        const name = e.target.name;
        const value = e.target.value;
        setFormData(data => ({ ...data, [name]: value }));
    };

    const handleAvatarClick = () => {
        if (isEditing && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!/^[0-9]{10}$/.test(formData.phone.replace(/\D/g, ''))) {
            toast.error('Please enter a valid 10-digit mobile number');
            setLoading(false);
            return;
        }
        if (!/^[0-9]{6}$/.test(formData.pincode)) {
            toast.error('Please enter a valid 6-digit pincode');
            setLoading(false);
            return;
        }

        try {
            const submitData = new FormData();
            submitData.append('firstName', formData.firstName);
            submitData.append('lastName', formData.lastName);
            submitData.append('phone', formData.phone);
            submitData.append('houseNo', formData.houseNo);
            submitData.append('street', formData.street);
            submitData.append('landmark', formData.landmark);
            submitData.append('city', formData.city);
            submitData.append('state', formData.state);
            submitData.append('pincode', formData.pincode);
            submitData.append('addressType', formData.addressType);
            submitData.append('country', formData.country);
            if (avatarFile) {
                submitData.append('avatar', avatarFile);
            }

            const response = await axios.post(backendUrl + '/api/user/update-profile', submitData, { headers: { Authorization: `Bearer ${token}` } });
            if (response.data.success) {
                toast.success('Profile updated successfully!');
                setIsEditing(false);
                if (formData.houseNo && formData.street && formData.pincode) {
                    setHasAddress?.(true);
                    // Automatic cart addition if we were redirected from Product page
                    if (location.state?.pendingCartItem) {
                        const { itemId, size } = location.state.pendingCartItem;
                        await addToCart(itemId, size, true, true);
                        
                        // Clear the location state so it doesn't run again
                        navigate('/cart', { replace: true });
                    }
                } else {
                    setHasAddress?.(false);
                }
                fetchUserProfile();
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

    const onSellerApply = async (e) => {
        e.preventDefault();
        setApplyingSeller(true);
        try {
            const submitPayload = {
                storeName: sellerForm.storeName,
                storePhone: sellerForm.storePhone,
                storeDescription: sellerForm.storeDescription,
                bankDetails: {
                    accountHolder: sellerForm.accountHolder,
                    accountNumber: sellerForm.accountNumber,
                    bankName: sellerForm.bankName,
                    ifscCode: sellerForm.ifscCode
                }
            };
            const response = await axios.post(
                backendUrl + '/api/seller/apply', 
                submitPayload, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                toast.success(response.data.message);
                setShowSellerModal(false);
                fetchUserProfile(); 
                fetchSellerStatus(token); // Update context to instantly reflect 'pending'
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to submit application');
        } finally {
            setApplyingSeller(false);
        }
    };

    const onDeliveryApply = async (e) => {
        e.preventDefault();
        setApplyingDelivery(true);
        try {
            const submitPayload = {
                userId: token ? JSON.parse(atob(token.split('.')[1])).id : null, // Not best practice but backend authUser also sets req.userId
                vehicleDetails: deliveryForm.vehicleDetails,
                drivingLicense: deliveryForm.drivingLicense,
                serviceCity: deliveryForm.serviceCity
            };
            const response = await axios.post(
                backendUrl + '/api/user/apply-delivery-partner', 
                submitPayload, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                toast.success(response.data.message);
                setShowDeliveryModal(false);
                fetchUserProfile(); 
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to submit application');
        } finally {
            setApplyingDelivery(false);
        }
    };

    if (!token) {
        return (
            <div className='flex justify-center items-center h-[60vh]'>
                <p className='text-gray-500'>Please login to view your profile.</p>
            </div>
        );
    }

    return (
        <div className='flex flex-col gap-10 pt-10 border-t min-h-screen bg-gray-50/30'>
            
            <div className='text-2xl px-4 sm:px-0'>
                <Title text1={'MY'} text2={'PROFILE'} />
            </div>

            <div className='flex flex-col lg:flex-row gap-8 px-4 sm:px-0'>
                
                {/* User Avatar & Status Section (Glassmorphism) */}
                <div className='w-full lg:w-[350px] flex flex-col gap-6 shrink-0'>
                    
                    {/* Avatar Card */}
                    <div className='bg-white/70 backdrop-blur-xl border border-white rounded-3xl p-8 flex flex-col items-center text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden'>
                        <div className='absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-pink-50/50 pointer-events-none' />
                        
                        <div className='relative z-10'>
                            <div 
                                onClick={handleAvatarClick}
                                className={`w-32 h-32 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-xl relative transition-all duration-300 ${isEditing ? 'cursor-pointer hover:shadow-indigo-200/50 hover:scale-105' : ''}`}
                            >
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-300">
                                        <User className="w-12 h-12" />
                                    </div>
                                )}
                                
                                {isEditing && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                        <Camera className="w-8 h-8 text-white" />
                                    </div>
                                )}
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>
                            
                            <h2 className='text-2xl font-bold text-gray-900 mt-5'>{formData.firstName} {formData.lastName}</h2>
                            <p className='text-sm font-medium text-gray-500 mt-1 flex items-center justify-center gap-1.5'>
                                <Mail className='w-3.5 h-3.5' />
                                {formData.email}
                            </p>
                        </div>

                        <button 
                            type="button"
                            onClick={() => {
                                setIsEditing(!isEditing);
                                if (isEditing) {
                                    setAvatarPreview(originalAvatar);
                                    setAvatarFile(null);
                                    fetchUserProfile();
                                }
                            }} 
                            className={`mt-8 w-full py-3 px-6 text-sm font-bold rounded-xl transition-all shadow-md z-10 ${isEditing ? 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50' : 'bg-gray-900 text-white hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5'}`}
                        >
                            {isEditing ? 'CANCEL EDITING' : 'EDIT PROFILE'}
                        </button>
                    </div>

                    {/* Seller Status Card (Glassmorphism) */}
                    <div className='bg-white/70 backdrop-blur-xl border border-white rounded-3xl p-6 flex flex-col gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden'>
                        <div className='absolute inset-0 bg-gradient-to-br from-blue-50/50 to-emerald-50/50 pointer-events-none' />
                        
                        <div className='relative z-10'>
                            {sellerStatus === 'approved' ? (
                                <>
                                    <div className='w-12 h-12 rounded-2xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center mb-4 shadow-inner'>
                                        <ShieldCheck className="w-6 h-6" />
                                    </div>
                                    <h4 className='text-base font-bold text-gray-900'>Verified Seller Partner</h4>
                                    <p className='text-sm text-gray-500 leading-relaxed mt-1'>
                                        Your store is live! Access products, orders, inventory, and payouts.
                                    </p>
                                    <button 
                                        onClick={() => window.open(`${import.meta.env.VITE_SELLER_URL || 'http://localhost:5175'}/?sso_token=${token}`, '_blank')} 
                                        className='mt-5 w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2'
                                    >
                                        OPEN DASHBOARD <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </>
                            ) : sellerStatus === 'pending' ? (
                                <>
                                    <div className='w-12 h-12 rounded-2xl bg-amber-100/80 text-amber-600 flex items-center justify-center mb-4 shadow-inner'>
                                        <Clock className="w-6 h-6" />
                                    </div>
                                    <h4 className='text-base font-bold text-gray-900'>Application Pending</h4>
                                    <p className='text-sm text-gray-500 leading-relaxed mt-1'>
                                        Your seller application is under review by admin moderation. Check back shortly!
                                    </p>
                                    <button 
                                        onClick={() => window.open(`${import.meta.env.VITE_SELLER_URL || 'http://localhost:5175'}/?sso_token=${token}`, '_blank')} 
                                        className='mt-5 w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2'
                                    >
                                        CHECK STATUS <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </>
                            ) : sellerStatus === 'rejected' ? (
                                <>
                                    <div className='w-12 h-12 rounded-2xl bg-rose-100/80 text-rose-600 flex items-center justify-center mb-4 shadow-inner'>
                                        <XCircle className="w-6 h-6" />
                                    </div>
                                    <h4 className='text-base font-bold text-gray-900'>Application Rejected</h4>
                                    <p className='text-sm text-gray-500 leading-relaxed mt-1'>
                                        Your application did not meet criteria. You can update details and apply again.
                                    </p>
                                    <button 
                                        onClick={() => setShowSellerModal(true)} 
                                        className='mt-5 w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2'
                                    >
                                        APPLY AGAIN <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className='w-12 h-12 rounded-2xl bg-blue-100/80 text-blue-600 flex items-center justify-center mb-4 shadow-inner'>
                                        <Store className="w-6 h-6" />
                                    </div>
                                    <h4 className='text-base font-bold text-gray-900'>Become a Seller</h4>
                                    <p className='text-sm text-gray-500 leading-relaxed mt-1'>
                                        Start selling your apparel designs, list products, track orders, and grow your brand.
                                    </p>
                                    <button 
                                        onClick={() => setShowSellerModal(true)} 
                                        className='mt-5 w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2'
                                    >
                                        BECOME A SELLER <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Delivery Partner Status Card (Glassmorphism) */}
                    <div className='bg-white/70 backdrop-blur-xl border border-white rounded-3xl p-6 flex flex-col gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden'>
                        <div className='absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 pointer-events-none' />
                        
                        <div className='relative z-10'>
                            {deliveryStatus === 'approved' ? (
                                <>
                                    <div className='w-12 h-12 rounded-2xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center mb-4 shadow-inner'>
                                        <ShieldCheck className="w-6 h-6" />
                                    </div>
                                    <h4 className='text-base font-bold text-gray-900'>Verified Wishmaster</h4>
                                    <p className='text-sm text-gray-500 leading-relaxed mt-1'>
                                        You are an approved Delivery Partner. Access your portal to accept orders and earn.
                                    </p>
                                    <button 
                                        onClick={() => window.open(`${import.meta.env.VITE_DELIVERY_URL || 'http://localhost:5176'}/?sso_token=${token}`, '_blank')} 
                                        className='mt-5 w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2'
                                    >
                                        OPEN DELIVERY PORTAL <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </>
                            ) : deliveryStatus === 'pending' ? (
                                <>
                                    <div className='w-12 h-12 rounded-2xl bg-amber-100/80 text-amber-600 flex items-center justify-center mb-4 shadow-inner'>
                                        <Clock className="w-6 h-6" />
                                    </div>
                                    <h4 className='text-base font-bold text-gray-900'>Wishmaster Application Pending</h4>
                                    <p className='text-sm text-gray-500 leading-relaxed mt-1'>
                                        Your delivery partner application is under review. Check back shortly!
                                    </p>
                                </>
                            ) : deliveryStatus === 'rejected' ? (
                                <>
                                    <div className='w-12 h-12 rounded-2xl bg-rose-100/80 text-rose-600 flex items-center justify-center mb-4 shadow-inner'>
                                        <XCircle className="w-6 h-6" />
                                    </div>
                                    <h4 className='text-base font-bold text-gray-900'>Wishmaster Application Rejected</h4>
                                    <p className='text-sm text-gray-500 leading-relaxed mt-1'>
                                        Your application did not meet criteria. You can update details and apply again.
                                    </p>
                                    <button 
                                        onClick={() => setShowDeliveryModal(true)} 
                                        className='mt-5 w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2'
                                    >
                                        APPLY AGAIN <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className='w-12 h-12 rounded-2xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center mb-4 shadow-inner'>
                                        <Truck className="w-6 h-6" />
                                    </div>
                                    <h4 className='text-base font-bold text-gray-900'>Become a Wishmaster</h4>
                                    <p className='text-sm text-gray-500 leading-relaxed mt-1'>
                                        Join our delivery fleet! Earn on your own schedule by delivering fashion to customers.
                                    </p>
                                    <button 
                                        onClick={() => setShowDeliveryModal(true)} 
                                        className='mt-5 w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2'
                                    >
                                        JOIN THE FLEET <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Profile Form Section (Glassmorphism) */}
                <div className={`flex-1 bg-white/60 backdrop-blur-xl border ${highlightEdit ? 'border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.6)] animate-pulse' : 'border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]'} rounded-2xl p-5 sm:p-7 relative transition-all duration-700`}>
                    
                    <form onSubmit={onSubmitHandler} className='flex flex-col gap-6 relative z-10'>
                        
                        {/* Personal Info */}
                        <div>
                            <h3 className='text-xs font-bold tracking-widest text-indigo-900 mb-4 flex items-center gap-2 uppercase'>
                                <User className="w-4 h-4" /> Personal Details
                            </h3>
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                <div>
                                    <label className='text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block'>First Name</label>
                                    <input 
                                        name='firstName'
                                        onChange={onChangeHandler}
                                        value={formData.firstName}
                                        className={`w-full px-3 py-2.5 rounded-lg border outline-none transition-all text-xs sm:text-sm font-medium ${isEditing ? 'border-indigo-200 bg-white shadow-inner focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100' : 'border-transparent bg-gray-100/50 text-gray-600'}`} 
                                        type="text" 
                                        readOnly={!isEditing}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className='text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block'>Last Name</label>
                                    <input 
                                        name='lastName'
                                        onChange={onChangeHandler}
                                        value={formData.lastName}
                                        className={`w-full px-3 py-2.5 rounded-lg border outline-none transition-all text-xs sm:text-sm font-medium ${isEditing ? 'border-indigo-200 bg-white shadow-inner focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100' : 'border-transparent bg-gray-100/50 text-gray-600'}`} 
                                        type="text" 
                                        readOnly={!isEditing}
                                    />
                                </div>
                                <div>
                                    <label className='text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block'>Email Address</label>
                                    <input 
                                        name='email'
                                        value={formData.email}
                                        className="w-full px-3 py-2.5 rounded-lg border border-transparent bg-gray-100/50 text-gray-500 text-xs sm:text-sm font-medium outline-none cursor-not-allowed" 
                                        type="email" 
                                        readOnly
                                        disabled
                                        title="Email cannot be changed"
                                    />
                                </div>
                                <div>
                                    <label className='text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block'>Phone Number</label>
                                    <input 
                                        name='phone'
                                        onChange={onChangeHandler}
                                        value={formData.phone}
                                        className={`w-full px-3 py-2.5 rounded-lg border outline-none transition-all text-xs sm:text-sm font-medium ${isEditing ? 'border-indigo-200 bg-white shadow-inner focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100' : 'border-transparent bg-gray-100/50 text-gray-600'}`} 
                                        type="tel" 
                                        readOnly={!isEditing}
                                        placeholder="+1 234 567 890"
                                    />
                                </div>
                            </div>
                        </div>

                        <hr className="border-gray-200/60" />

                        {/* Shipping Address (Flipkart Style) */}
                        <div>
                            <h3 className='text-xs font-bold tracking-widest text-indigo-900 mb-4 flex items-center gap-2 uppercase'>
                                <MapPin className="w-4 h-4" /> Shipping Address
                            </h3>
                            <div className='flex flex-col gap-4'>
                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                    <div>
                                        <label className='text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block'>Pincode <span className="text-red-500">*</span></label>
                                        <input 
                                            name='pincode'
                                            onChange={onChangeHandler}
                                            value={formData.pincode}
                                            className={`w-full px-3 py-2.5 rounded-lg border outline-none transition-all text-xs sm:text-sm font-medium ${isEditing ? 'border-indigo-200 bg-white shadow-inner focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100' : 'border-transparent bg-gray-100/50 text-gray-600'}`} 
                                            type="text" 
                                            readOnly={!isEditing}
                                            required
                                            maxLength={6}
                                        />
                                    </div>
                                    <div>
                                        <label className='text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block'>Locality / Area <span className="text-red-500">*</span></label>
                                        <input 
                                            name='street'
                                            onChange={onChangeHandler}
                                            value={formData.street}
                                            className={`w-full px-3 py-2.5 rounded-lg border outline-none transition-all text-xs sm:text-sm font-medium ${isEditing ? 'border-indigo-200 bg-white shadow-inner focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100' : 'border-transparent bg-gray-100/50 text-gray-600'}`} 
                                            type="text" 
                                            readOnly={!isEditing}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className='text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block'>House No., Building, Flat <span className="text-red-500">*</span></label>
                                    <input 
                                        name='houseNo'
                                        onChange={onChangeHandler}
                                        value={formData.houseNo}
                                        className={`w-full px-3 py-2.5 rounded-lg border outline-none transition-all text-xs sm:text-sm font-medium ${isEditing ? 'border-indigo-200 bg-white shadow-inner focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100' : 'border-transparent bg-gray-100/50 text-gray-600'}`} 
                                        type="text" 
                                        readOnly={!isEditing}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className='text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block'>Landmark (Optional)</label>
                                    <input 
                                        name='landmark'
                                        onChange={onChangeHandler}
                                        value={formData.landmark}
                                        className={`w-full px-3 py-2.5 rounded-lg border outline-none transition-all text-xs sm:text-sm font-medium ${isEditing ? 'border-indigo-200 bg-white shadow-inner focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100' : 'border-transparent bg-gray-100/50 text-gray-600'}`} 
                                        type="text" 
                                        readOnly={!isEditing}
                                    />
                                </div>
                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                    <div>
                                        <label className='text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block'>City / District <span className="text-red-500">*</span></label>
                                        <input 
                                            name='city'
                                            onChange={onChangeHandler}
                                            value={formData.city}
                                            className={`w-full px-3 py-2.5 rounded-lg border outline-none transition-all text-xs sm:text-sm font-medium ${isEditing ? 'border-indigo-200 bg-white shadow-inner focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100' : 'border-transparent bg-gray-100/50 text-gray-600'}`} 
                                            type="text" 
                                            readOnly={!isEditing}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className='text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block'>State <span className="text-red-500">*</span></label>
                                        <input 
                                            name='state'
                                            onChange={onChangeHandler}
                                            value={formData.state}
                                            className={`w-full px-3 py-2.5 rounded-lg border outline-none transition-all text-xs sm:text-sm font-medium ${isEditing ? 'border-indigo-200 bg-white shadow-inner focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100' : 'border-transparent bg-gray-100/50 text-gray-600'}`} 
                                            type="text" 
                                            readOnly={!isEditing}
                                            required
                                        />
                                    </div>
                                </div>
                                
                                {/* Address Type Selection */}
                                <div>
                                    <label className='text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block'>Address Type</label>
                                    <div className="flex gap-3">
                                        <label className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all cursor-pointer ${formData.addressType === 'Home' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold shadow-sm' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'} ${!isEditing && 'pointer-events-none'}`}>
                                            <input 
                                                type="radio" 
                                                name="addressType" 
                                                value="Home" 
                                                checked={formData.addressType === 'Home'}
                                                onChange={onChangeHandler}
                                                className="hidden"
                                                disabled={!isEditing}
                                            />
                                            <span className="text-xs">🏠 Home</span>
                                        </label>
                                        <label className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all cursor-pointer ${formData.addressType === 'Work' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold shadow-sm' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'} ${!isEditing && 'pointer-events-none'}`}>
                                            <input 
                                                type="radio" 
                                                name="addressType" 
                                                value="Work" 
                                                checked={formData.addressType === 'Work'}
                                                onChange={onChangeHandler}
                                                className="hidden"
                                                disabled={!isEditing}
                                            />
                                            <span className="text-xs">🏢 Work</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        {isEditing && (
                            <div className='flex justify-end mt-2'>
                                <button 
                                    type='submit' 
                                    disabled={loading}
                                    className='bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl text-xs sm:text-sm font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 flex items-center justify-center gap-2 min-w-[160px]'
                                >
                                    {loading ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    ) : (
                                        'SAVE CHANGES'
                                    )}
                                </button>
                            </div>
                        )}

                    </form>
                </div>
            </div>

            {/* Become a Seller Modal */}
            {showSellerModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl relative animate-fade-in max-h-[90vh] flex flex-col overflow-hidden">
                        
                        {/* Header (Fixed) */}
                        <div className="shrink-0 pt-6 px-6 sm:px-8 pb-4 border-b border-gray-100 relative">
                            <button 
                                type="button"
                                onClick={() => setShowSellerModal(false)}
                                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors bg-gray-100 hover:bg-gray-200 rounded-full p-1"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                                    <Store className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Seller Application</h2>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Join our marketplace and start selling today.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Scrollable Body */}
                        <div className="flex-1 overflow-y-auto p-6 sm:px-8 py-6 custom-scrollbar bg-gray-50/30">
                            <form id="sellerForm" onSubmit={onSellerApply} className="flex flex-col gap-6">
                                
                                {/* Business Details Section */}
                                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                    <h3 className="text-[11px] font-bold tracking-widest text-indigo-900 mb-4 flex items-center gap-2 uppercase">
                                        <Store className="w-3.5 h-3.5" /> Store Information
                                    </h3>
                                    <div className="flex flex-col gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-700 uppercase mb-1 block">Store / Brand Name <span className="text-red-500">*</span></label>
                                            <input 
                                                type="text" 
                                                required 
                                                placeholder="e.g. Velvet & Co."
                                                value={sellerForm.storeName}
                                                onChange={(e) => setSellerForm({...sellerForm, storeName: e.target.value})}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm bg-gray-50/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-700 uppercase mb-1 block">Contact Phone <span className="text-red-500">*</span></label>
                                            <input 
                                                type="tel" 
                                                required
                                                placeholder="+1 234 567 890"
                                                value={sellerForm.storePhone}
                                                onChange={(e) => setSellerForm({...sellerForm, storePhone: e.target.value})}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm bg-gray-50/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-700 uppercase mb-1 block">Store Description</label>
                                            <textarea 
                                                rows="2"
                                                placeholder="Briefly describe your collection..."
                                                value={sellerForm.storeDescription}
                                                onChange={(e) => setSellerForm({...sellerForm, storeDescription: e.target.value})}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm resize-none bg-gray-50/50"
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>

                                {/* Payout Details Section */}
                                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                    <h3 className="text-[11px] font-bold tracking-widest text-indigo-900 mb-2 flex items-center gap-2 uppercase">
                                        <ShieldCheck className="w-3.5 h-3.5" /> Bank Details
                                    </h3>
                                    <p className="text-[10px] text-gray-500 mb-4">Confidential & secure for payouts.</p>
                                    <div className="flex flex-col gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-700 uppercase mb-1 block">Account Holder Name</label>
                                            <input 
                                                type="text" 
                                                placeholder="John Doe"
                                                value={sellerForm.accountHolder}
                                                onChange={(e) => setSellerForm({...sellerForm, accountHolder: e.target.value})}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm bg-gray-50/50"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-700 uppercase mb-1 block">Bank Name</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="Chase"
                                                    value={sellerForm.bankName}
                                                    onChange={(e) => setSellerForm({...sellerForm, bankName: e.target.value})}
                                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm bg-gray-50/50"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-700 uppercase mb-1 block">IFSC / Swift</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="CHASUS"
                                                    value={sellerForm.ifscCode}
                                                    onChange={(e) => setSellerForm({...sellerForm, ifscCode: e.target.value})}
                                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm bg-gray-50/50 uppercase font-mono"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-700 uppercase mb-1 block">Account Number</label>
                                            <input 
                                                type="text" 
                                                placeholder="XXXX XXXX XXXX"
                                                value={sellerForm.accountNumber}
                                                onChange={(e) => setSellerForm({...sellerForm, accountNumber: e.target.value})}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm bg-gray-50/50 font-mono tracking-wider"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Footer (Fixed) */}
                        <div className="shrink-0 p-6 sm:px-8 bg-white border-t border-gray-100">
                            <button 
                                form="sellerForm"
                                type="submit" 
                                disabled={applyingSeller}
                                className="w-full py-3.5 bg-gradient-to-r from-gray-900 to-black hover:from-gray-800 hover:to-gray-900 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 text-xs tracking-wide"
                            >
                                {applyingSeller ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        SUBMITTING...
                                    </span>
                                ) : (
                                    <>SUBMIT APPLICATION TO SELL <ArrowRight className="w-3.5 h-3.5" /></>
                                )}
                            </button>
                            <p className="text-center text-[10px] text-gray-400 mt-3">
                                By submitting, you agree to our Seller Terms & Conditions.
                            </p>
                        </div>

                    </div>
                </div>
            )}

            {/* Become a Delivery Partner Modal */}
            {showDeliveryModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl relative animate-fade-in max-h-[90vh] flex flex-col overflow-hidden">
                        
                        <div className="shrink-0 pt-6 px-6 sm:px-8 pb-4 border-b border-gray-100 relative">
                            <button 
                                type="button"
                                onClick={() => setShowDeliveryModal(false)}
                                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors bg-gray-100 hover:bg-gray-200 rounded-full p-1"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                                    <Truck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Wishmaster Fleet Application</h2>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Deliver smiles and earn on your schedule.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 sm:px-8 py-6 custom-scrollbar bg-gray-50/30">
                            <form id="deliveryForm" onSubmit={onDeliveryApply} className="flex flex-col gap-6">
                                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                    <h3 className="text-[11px] font-bold tracking-widest text-indigo-900 mb-4 flex items-center gap-2 uppercase">
                                        <Truck className="w-3.5 h-3.5" /> Fleet Information
                                    </h3>
                                    <div className="flex flex-col gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-700 uppercase mb-1 block">Vehicle Type & Model <span className="text-red-500">*</span></label>
                                            <input 
                                                type="text" 
                                                required 
                                                placeholder="e.g. Honda Activa 6G"
                                                value={deliveryForm.vehicleDetails}
                                                onChange={(e) => setDeliveryForm({...deliveryForm, vehicleDetails: e.target.value})}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm bg-gray-50/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-700 uppercase mb-1 block">Driving License Number <span className="text-red-500">*</span></label>
                                            <input 
                                                type="text" 
                                                required
                                                placeholder="DL-XXXX-XXXXXXX"
                                                value={deliveryForm.drivingLicense}
                                                onChange={(e) => setDeliveryForm({...deliveryForm, drivingLicense: e.target.value})}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm bg-gray-50/50 uppercase font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-700 uppercase mb-1 block">Service City <span className="text-red-500">*</span></label>
                                            <input 
                                                type="text" 
                                                required
                                                placeholder="e.g. Mumbai"
                                                value={deliveryForm.serviceCity}
                                                onChange={(e) => setDeliveryForm({...deliveryForm, serviceCity: e.target.value})}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm bg-gray-50/50"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="shrink-0 p-6 sm:px-8 bg-white border-t border-gray-100">
                            <button 
                                form="deliveryForm"
                                type="submit" 
                                disabled={applyingDelivery}
                                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 text-xs tracking-wide"
                            >
                                {applyingDelivery ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        SUBMITTING...
                                    </span>
                                ) : (
                                    <>APPLY FOR FLEET <ArrowRight className="w-3.5 h-3.5" /></>
                                )}
                            </button>
                            <p className="text-center text-[10px] text-gray-400 mt-3">
                                You'll need to pass a background check before approval.
                            </p>
                        </div>

                    </div>
                </div>
            )}
        </div>
    )
}

export default Profile
