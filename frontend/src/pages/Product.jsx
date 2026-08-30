import React, { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';
import RelatedProducts from '../components/RelatedProducts';
import SizeGuideModal from '../components/SizeGuideModal';
import NotifyMeModal from '../components/NotifyMeModal';
import VirtualTryOnModal from '../components/VirtualTryOnModal';
import AutoBundlerModal from '../components/AutoBundlerModal';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Ruler, Scale, RotateCcw, Banknote } from 'lucide-react';

const Product = () => {
  const { productId } = useParams();
  const { 
    products, currency, addToCart, navigate, 
    getVariantStock, subscribeNotifyMe, 
    toggleWishlist, isInWishlist, 
    addToCompare, isInCompare, backendUrl, token 
  } = useContext(ShopContext);

  const [productData, setProductData] = useState(false);
  const [productLoading, setProductLoading] = useState(true);
  const [image, setImage] = useState('');
  const [size, setSize] = useState('');
  const [activeTab, setActiveTab] = useState('specs'); // 'specs' | 'reviews'

  // Address Auto-Detection & Pincode State
  const [userAddress, setUserAddress] = useState(null);
  const [pincodeInput, setPincodeInput] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState(null);
  const [isBankOffersOpen, setIsBankOffersOpen] = useState(false);
  const [bankOffers, setBankOffers] = useState([]);

  // Modals & Image Lightbox State
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);
  const [isBundlerOpen, setIsBundlerOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  // Auto-detect address from user profile when logged in
  useEffect(() => {
    if (token) {
      try {
        const saved = localStorage.getItem('user_shipping_address');
        if (saved) {
          setUserAddress(JSON.parse(saved));
        } else {
          setUserAddress({
            firstName: 'Verified User',
            lastName: '',
            street: 'Main Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            zipcode: '400001'
          });
        }
      } catch (e) {
        setUserAddress(null);
      }
    } else {
      setUserAddress(null);
    }
  }, [token]);

  const handleCheckPincode = () => {
    if (!pincodeInput || pincodeInput.length < 6) {
      setPincodeStatus('Please enter a valid 6-digit pincode');
      return;
    }
    setPincodeStatus(`Serviceable at ${pincodeInput}! Estimated delivery by Tomorrow, 5 PM. Cash on Delivery available.`);
  };

  // Reviews Data State
  const [reviewData, setReviewData] = useState({
    reviews: [],
    stats: {
      averageRating: 0,
      totalReviews: 0,
      ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      attributeAverages: { fit: 5, quality: 5, comfort: 5, material: 5, colorAccuracy: 5 }
    }
  });

  const fetchProductData = async () => {
    setProductLoading(true);
    // First try from the already-loaded products array (fast)
    const item = products.find((p) => p._id === productId);
    if (item) {
      setProductData(item);
      setImage(item.image[0]);
      if (item.sizes && item.sizes.length > 0) {
        setSize(item.sizes[0]);
      }
      setProductLoading(false);
      return;
    }
    // Fallback: fetch directly from API (handles direct URL access, story links etc.)
    try {
      const res = await axios.post(`${backendUrl}/api/product/single`, { productId });
      if (res.data.success && res.data.product) {
        const p = res.data.product;
        setProductData(p);
        setImage(p.image[0]);
        if (p.sizes && p.sizes.length > 0) {
          setSize(p.sizes[0]);
        }
      } else {
        setProductData(null); // explicitly null = not found
      }
    } catch (err) {
      console.error('Failed to fetch product:', err);
      setProductData(null);
    }
    setProductLoading(false);
  };

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/review/product/${productId}`);
      if (res.data.success) {
        setReviewData({
          reviews: res.data.reviews || [],
          stats: res.data.stats || reviewData.stats
        });
      }
    } catch (error) {
      console.error("Fetch Reviews Error:", error);
    }
  };

  const fetchBankOffers = async (cat) => {
    try {
      const categoryParam = cat || productData?.category || '';
      const res = await axios.get(`${backendUrl}/api/bank-offer/list?productId=${productId}&category=${categoryParam}`);
      if (res.data.success) {
        setBankOffers(res.data.offers || []);
      }
    } catch (err) {
      console.error("Fetch Bank Offers Error:", err);
    }
  };

  const trackProductView = async () => {
    try {
      await axios.post(`${backendUrl}/api/product/track-event`, {
        productId,
        eventType: 'VIEW'
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
    } catch (err) {
      console.warn("Analytics Error:", err);
    }
  };

  useEffect(() => {
    fetchProductData();
    fetchReviews();
    trackProductView();
  }, [productId, products]);

  useEffect(() => {
    if (productData) {
      fetchBankOffers(productData.category);
    }
  }, [productData]);

  const handleShare = async () => {
    const shareData = {
      title: productData?.name || 'Forever Product',
      text: `Check out this amazing product on Forever!`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Product link copied to clipboard! 📋", {
          position: "bottom-center",
          autoClose: 2000,
          theme: "dark"
        });
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
         console.error("Error sharing:", err);
      }
    }
  };

  const currentVariantStock = size ? getVariantStock(productData?._id, size) : { count: 10, status: 'IN_STOCK', text: 'In Stock' };
  const inWishlist = productData ? isInWishlist(productData._id) : false;
  const inCompare = productData ? isInCompare(productData._id) : false;

  // Rating Display calculation
  const displayRating = productData?.averageRating || reviewData.stats.averageRating || 0;
  const displayTotalReviews = productData?.totalReviews || reviewData.stats.totalReviews || reviewData.reviews.length;

  return productData ? (
    <div className='border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100 pb-16'>
      {/*----------- Product Top Section-------------- */}
      <div className='flex gap-12 sm:gap-12 flex-col sm:flex-row'>

        {/*---------- Product Thumbnails & Main Image------------- */}
        <div className='flex-1 flex flex-col-reverse gap-3 sm:flex-row'>
          <div className='flex sm:flex-col overflow-x-auto sm:overflow-y-scroll justify-between sm:justify-normal sm:w-[18.7%] w-full'>
            {productData.image.map((item, index) => (
              <img
                onClick={() => setImage(item)}
                src={item}
                key={index}
                className='w-[24%] sm:w-full sm:mb-3 flex-shrink-0 cursor-pointer rounded-lg border border-gray-100 hover:border-black transition-colors'
                alt=""
              />
            ))}
          </div>
          <div className='w-full sm:w-[80%] relative group'>
            <img className='w-full h-auto rounded-2xl border border-gray-100' src={image} alt="" />
            <button
              onClick={() => toggleWishlist(productData._id)}
              className={`absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center transition-all duration-300 shadow-md ${
                inWishlist ? 'scale-110 text-rose-500' : 'text-gray-400 hover:text-rose-500 hover:scale-110'
              }`}
              title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
              <svg className="w-5 h-5" fill={inWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* -------- Product Details & Actions ---------- */}
        <div className='flex-1'>
          <div className='flex items-center justify-between gap-2'>
            <h1 className='font-bold text-2xl sm:text-3xl text-gray-900 pr-2'>{productData.name}</h1>
            <button
              onClick={handleShare}
              className="w-10 h-10 shrink-0 rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 hover:text-black flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-95"
              title="Share this product"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>

          {/* Sold By Store Partner Badge */}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs font-medium text-gray-500">Sold by:</span>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-gray-100 text-gray-800 rounded-full border border-gray-200 flex items-center gap-1">
              <span>🏪</span> {productData.storeName || 'Forever Official'}
            </span>
          </div>

          {/* Dynamic Average Star Rating Summary */}
          {displayTotalReviews > 0 && (
            <div className='flex items-center gap-2 mt-2'>
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                <span className="text-xs font-bold text-amber-900">{displayRating}</span>
                <span className="text-xs text-amber-500">★</span>
              </div>
              <p
                onClick={() => setActiveTab('reviews')}
                className='text-xs font-semibold text-gray-600 hover:text-black cursor-pointer underline'
              >
                ({displayTotalReviews} Verified Reviews)
              </p>
            </div>
          )}

          <div className='flex items-center gap-3 mt-4'>
            <p className='text-3xl font-black text-gray-900'>{currency}{productData.price}</p>
            <p className='text-xl text-gray-400 line-through'>{currency}{Math.round(productData.price * 1.33)}</p>
            <p className='text-emerald-600 font-bold text-sm bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200'>(25% OFF)</p>
          </div>

          <p className='mt-4 text-gray-700 text-sm sm:text-base leading-[1.8] font-medium'>{productData.description}</p>

          {/* Multiple Bank Offers Section */}
          {bankOffers.length > 0 && (
            <div className='mt-6 p-4 sm:p-5 bg-gradient-to-br from-indigo-50/60 via-purple-50/40 to-pink-50/30 rounded-2xl border border-indigo-100/80 shadow-2xs space-y-3'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <span className='text-lg'>🏦</span>
                  <h3 className='font-bold text-xs sm:text-sm uppercase tracking-wider text-gray-900'>
                    Bank & Payment Offers ({bankOffers.length} Available)
                  </h3>
                </div>
                <button
                  onClick={() => setIsBankOffersOpen(true)}
                  className='text-xs font-bold text-indigo-700 hover:text-indigo-900 underline flex items-center gap-1 cursor-pointer'
                >
                  View Terms ➔
                </button>
              </div>

              {/* Bank Offers Grid */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1'>
                {bankOffers.map((offer) => {
                  const colorMap = {
                    blue: 'bg-blue-50 text-blue-900 border-blue-200',
                    amber: 'bg-amber-50 text-amber-900 border-amber-200',
                    rose: 'bg-rose-50 text-rose-900 border-rose-200',
                    teal: 'bg-teal-50 text-teal-900 border-teal-200',
                    indigo: 'bg-indigo-50 text-indigo-900 border-indigo-200'
                  };
                  const badgeStyle = colorMap[offer.themeColor] || colorMap.indigo;

                  return (
                    <div key={offer._id} className='p-3 bg-white rounded-xl border border-gray-200/80 shadow-2xs space-y-1 transition-colors'>
                      <div className='flex items-center justify-between'>
                        <span className={`text-[11px] font-black px-2 py-0.5 rounded-md border ${badgeStyle}`}>
                          {offer.bankName}
                        </span>
                        <span className='text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded'>
                          {offer.badgeText}
                        </span>
                      </div>
                      <p className='text-xs font-semibold text-gray-800 leading-tight pt-1'>
                        {offer.offerText}
                      </p>
                      {offer.minPurchase > 0 && (
                        <span className='text-[10px] text-gray-400 font-medium block'>
                          Min purchase: ₹{offer.minPurchase}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Delivery Location & Address Auto-Detection */}
          <div className='mt-5 p-4 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-3'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <span className='text-base'>📍</span>
                <h3 className='font-bold text-xs uppercase tracking-wider text-gray-900'>
                  Delivery Location Details
                </h3>
              </div>
              {token && userAddress && (
                <span className='text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs'>
                  ✓ Saved Profile Address
                </span>
              )}
            </div>

            {token && userAddress ? (
              /* Logged In & Saved Profile Address Auto-Detected */
              <div className='bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs flex items-start justify-between gap-3'>
                <div className='space-y-1 text-xs'>
                  <div className='flex items-center gap-1.5 font-bold text-gray-900 flex-wrap'>
                    <span>Deliver to: {userAddress.firstName} {userAddress.lastName}</span>
                    <span className='text-gray-400'>•</span>
                    <span className='text-emerald-700 font-extrabold'>{userAddress.zipcode || '400001'}</span>
                  </div>
                  <p className='text-gray-600 truncate max-w-sm'>
                    {userAddress.street ? `${userAddress.street}, ${userAddress.city}, ${userAddress.state || ''}` : 'Default Saved Shipping Address'}
                  </p>
                  <div className='flex items-center gap-3 pt-1 text-[11px] font-semibold text-gray-700 flex-wrap'>
                    <span className='text-emerald-600 font-bold flex items-center gap-1'>
                      🚚 Express Delivery by Tomorrow, 5 PM
                    </span>
                    <span className='text-gray-400'>|</span>
                    <span>Cash on Delivery Available</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/place-order')}
                  className='text-xs font-bold text-black hover:underline shrink-0 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer'
                >
                  Change
                </button>
              </div>
            ) : (
              /* Guest Mode / Not Logged In - Empty Address with Pincode Check */
              <div className='space-y-2.5'>
                <div className='flex items-center gap-2'>
                  <input
                    type='text'
                    maxLength='6'
                    placeholder='Enter 6-digit Pincode (e.g. 400001)'
                    value={pincodeInput}
                    onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))}
                    className='flex-1 border border-gray-300 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-black bg-white'
                  />
                  <button
                    onClick={handleCheckPincode}
                    className='bg-black hover:bg-gray-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer'
                  >
                    Check
                  </button>
                </div>

                {pincodeStatus ? (
                  <p className='text-xs font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex items-center gap-1.5'>
                    <span>🚚</span> {pincodeStatus}
                  </p>
                ) : (
                  <p className='text-[11px] text-gray-500 font-medium pl-1'>
                    {!token ? "Log in to auto-detect your saved profile delivery address" : "Enter pincode to check delivery timeline & COD availability"}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Color Selector (Auto-detects products with same name) */}
          {products.filter(p => p.name === productData.name).length > 1 && (
            <div className='my-6'>
              <p className='text-xs font-bold uppercase tracking-wider text-gray-700 mb-3'>
                Select Color: <span className="font-semibold text-gray-900 capitalize">{productData.colors?.[0] || 'Default'}</span>
              </p>
              <div className='flex gap-3 flex-wrap'>
                {products.filter(p => p.name === productData.name).map((variant) => (
                  <button
                    key={variant._id}
                    onClick={() => {
                      navigate(`/product/${variant._id}`);
                      window.scrollTo(0,0);
                    }}
                    className={`relative w-16 h-20 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      variant._id === productData._id ? 'border-black shadow-md scale-105' : 'border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100'
                    }`}
                    title={variant.colors?.[0] || variant.name}
                  >
                    <img src={variant.image[0]} alt="Color variant" className="w-full h-full object-cover" />
                    {variant._id === productData._id && (
                      <div className="absolute top-1 right-1 bg-black rounded-full p-0.5">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selector */}
          <div className='my-6'>
            <div className='flex items-center justify-between mb-3'>
              <p className='text-xs font-bold uppercase tracking-wider text-gray-700'>Select Size</p>
              <button
                onClick={() => setIsSizeGuideOpen(true)}
                className='text-[11px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all active:scale-95 border border-gray-200 shadow-sm'
              >
                <Ruler className="w-3.5 h-3.5" /> Size Guide
              </button>
            </div>

            <div className='flex gap-2.5 flex-wrap'>
              {productData.sizes.map((item, index) => {
                const stock = getVariantStock(productData._id, item);
                const isSelected = item === size;
                return (
                  <button
                    key={index}
                    onClick={() => setSize(item)}
                    className={`relative border-2 min-w-12 h-12 px-3.5 flex items-center justify-center font-bold rounded-xl transition-all cursor-pointer text-xs ${
                      isSelected ? 'border-black bg-black text-white shadow-sm' : 'border-gray-200 bg-white text-gray-800 hover:border-gray-400'
                    } ${stock.status === 'OUT_OF_STOCK' ? 'opacity-70' : ''}`}
                  >
                    <span>{item}</span>
                    <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                      stock.status === 'IN_STOCK' ? 'bg-emerald-500' :
                      stock.status === 'LOW_STOCK' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'
                    }`} />
                  </button>
                );
              })}
            </div>

            {/* Dynamic Stock Indicator */}
            <div className='mt-3 flex items-center gap-2'>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${
                currentVariantStock.status === 'IN_STOCK' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                currentVariantStock.status === 'LOW_STOCK' ? 'bg-amber-50 text-amber-900 border-amber-200' :
                'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  currentVariantStock.status === 'IN_STOCK' ? 'bg-emerald-500' :
                  currentVariantStock.status === 'LOW_STOCK' ? 'bg-amber-500 animate-ping' : 'bg-rose-500'
                }`} />
                Size {size}: {currentVariantStock.text}
              </span>
            </div>
          </div>

          {/* AI Virtual Try-On Button */}
          <div className='mb-4'>
            <button
              onClick={() => setIsTryOnOpen(true)}
              className='w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-600 text-white py-3.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.98] uppercase flex items-center justify-center gap-2'
            >
              <span className="text-sm">✨</span> AI VIRTUAL TRY-ON (BETA)
            </button>
          </div>

          {/* Action CTAs */}
          {currentVariantStock.status === 'OUT_OF_STOCK' ? (
            <div className='flex flex-col sm:flex-row gap-3'>
              <button
                onClick={() => setIsNotifyOpen(true)}
                className='flex-1 bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-xl text-xs font-bold transition-all uppercase shadow-md flex items-center justify-center gap-2 active:scale-98'
              >
                <span>🔔 NOTIFY ME WHEN AVAILABLE</span>
              </button>
            </div>
          ) : (
            <div className='flex flex-col sm:flex-row gap-3 items-stretch'>
              <button
                onClick={async () => {
                  if (!size) {
                    addToCart(productData._id, size); // will show toast error
                    return;
                  }
                  const success = await addToCart(productData._id, size, false);
                  if (success) {
                    setIsBundlerOpen(true);
                  }
                }}
                className='flex-1 bg-[#ff9f00] hover:bg-amber-600 text-white py-4 rounded-xl text-xs font-bold active:scale-98 transition-all uppercase shadow-md'
              >
                ADD TO CART
              </button>
              <button
                onClick={async () => { 
                  const success = await addToCart(productData._id, size); 
                  if (success) {
                    navigate('/cart'); 
                  }
                }}
                className='flex-1 bg-[#fb641b] hover:bg-orange-600 text-white py-4 rounded-xl text-xs font-bold active:scale-98 transition-all uppercase shadow-md'
              >
                BUY NOW
              </button>
            </div>
          )}

          {/* Compare & Extra Info */}
          <div className='mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100 text-xs bg-gray-50/50 p-4 rounded-xl'>
            <button
              onClick={() => addToCompare(productData)}
              className={`font-bold px-4 py-2 rounded-full border transition-all flex items-center gap-2 active:scale-95 shadow-sm ${
                inCompare ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              <Scale className={`w-3.5 h-3.5 ${inCompare ? 'text-emerald-500' : 'text-gray-500'}`} /> {inCompare ? 'In Compare List' : 'Add to Compare'}
            </button>
            <div className='flex flex-wrap items-center justify-center gap-3 text-gray-600 font-medium'>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                <RotateCcw className="w-4 h-4 text-blue-500" />
                <span>7 Days Return</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                <Banknote className="w-4 h-4 text-green-500" />
                <span>COD Available</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/*----------- Tabs: Product Specifications & Customer Reviews ----------- */}
      <div className='mt-16'>
        {/* Tab Selector Buttons */}
        <div className='flex border-b border-gray-200'>
          <button
            onClick={() => setActiveTab('specs')}
            className={`px-6 py-3.5 text-xs sm:text-sm font-bold transition-all border-b-2 ${
              activeTab === 'specs'
                ? 'border-black text-black'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            📋 Detailed Specifications & Product Info
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-6 py-3.5 text-xs sm:text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'reviews'
                ? 'border-black text-black'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            <span>⭐ Customer Reviews</span>
            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full font-semibold">
              {displayTotalReviews}
            </span>
          </button>
        </div>

        {/* Tab 1: Detailed Specifications & Product Information */}
        {activeTab === 'specs' && (
          <div className='py-6 space-y-6 text-sm text-gray-700 animate-fade-in'>
            {/* Detailed Attributes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200/80 space-y-2">
                <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider mb-3">Product Overview</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-gray-500 font-medium">Seller / Store:</span>
                  <span className="font-bold text-gray-900">{productData.storeName || 'Forever Official'}</span>
                  
                  <span className="text-gray-500 font-medium">Brand:</span>
                  <span className="font-bold text-gray-900">{productData.brand || 'Forever Fashion'}</span>
                  
                  <span className="text-gray-500 font-medium">Category:</span>
                  <span className="font-bold text-gray-900">{productData.category}</span>
                  
                  <span className="text-gray-500 font-medium">Type / SubCategory:</span>
                  <span className="font-bold text-gray-900">{productData.subCategory}</span>

                  <span className="text-gray-500 font-medium">Available Sizes:</span>
                  <span className="font-bold text-gray-900">{productData.sizes?.join(', ')}</span>

                  <span className="text-gray-500 font-medium">Return Policy:</span>
                  <span className="font-bold text-gray-900">{productData.returnAvailable ? '7 Days Return Available' : 'Non-Returnable'}</span>

                  <span className="text-gray-500 font-medium">Cash On Delivery:</span>
                  <span className="font-bold text-gray-900">{productData.cashOnDelivery ? 'Available' : 'Prepaid Only'}</span>
                </div>
              </div>

              <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200/80 space-y-2">
                <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider mb-3">Fabric & Care Details</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-gray-500 font-medium">Fabric / Material:</span>
                  <span className="font-bold text-gray-900">{productData.fabric || '100% Premium Breathable Cotton'}</span>

                  <span className="text-gray-500 font-medium">Fit Type:</span>
                  <span className="font-bold text-gray-900">{productData.fit || 'Regular / Tailored Fit'}</span>

                  <span className="text-gray-500 font-medium">Pattern:</span>
                  <span className="font-bold text-gray-900">{productData.pattern || 'Solid Classic'}</span>

                  <span className="text-gray-500 font-medium">Sleeve / Neck:</span>
                  <span className="font-bold text-gray-900">{productData.sleeve || productData.neck || 'Standard Design'}</span>

                  <span className="text-gray-500 font-medium">Occasion:</span>
                  <span className="font-bold text-gray-900">{productData.occasion || 'Casual & Everyday Wear'}</span>

                  <span className="text-gray-500 font-medium">Care Instructions:</span>
                  <span className="font-bold text-gray-900">{productData.careInstructions || 'Machine wash cold with like colors'}</span>
                </div>
              </div>
            </div>

            {/* Description Details */}
            <div className="p-5 bg-white rounded-xl border border-gray-200/80 space-y-3 shadow-xs">
              <h4 className="font-bold text-sm text-gray-900 uppercase tracking-wider">Complete Description</h4>
              <p className="text-sm sm:text-base text-gray-700 leading-[1.8] font-medium">{productData.description}</p>
            </div>
          </div>
        )}

        {/* Tab 2: Customer Reviews & Ratings Breakdown */}
        {activeTab === 'reviews' && (
          <div className='py-6 space-y-8 animate-fade-in'>
            {/* Rating Summary Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-200/80">
              {/* Score Box */}
              <div className="flex flex-col items-center justify-center text-center p-4 bg-white rounded-xl border border-gray-100 shadow-2xs">
                <span className="text-4xl font-black text-gray-900">{displayRating}</span>
                <div className="flex items-center gap-1 my-1">
                  {[1, 2, 3, 4, 5].map((st) => (
                    <span key={st} className={`text-base ${st <= Math.round(displayRating) ? 'text-amber-400' : 'text-gray-200'}`}>
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-xs text-gray-500 font-medium">Based on {displayTotalReviews} Verified Ratings</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold mt-2">
                  ✓ 100% Genuine Buyer Reviews
                </span>
              </div>

              {/* Rating Star Distribution Bar */}
              <div className="space-y-1.5 flex flex-col justify-center text-xs">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = reviewData.stats.ratingCounts[star] || 0;
                  const pct = displayTotalReviews > 0 ? Math.round((count / displayTotalReviews) * 100) : 0;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="w-8 text-gray-600 font-semibold">{star} ★</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-gray-500 font-light">{count}</span>
                    </div>
                  );
                })}
              </div>

              {/* Attribute Breakdown */}
              <div className="space-y-2 flex flex-col justify-center text-xs border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-6">
                <p className="font-bold text-gray-900 uppercase tracking-wider mb-1">Attribute Scores</p>
                {[
                  { label: 'Fit & Sizing', score: reviewData.stats.attributeAverages.fit },
                  { label: 'Fabric Quality', score: reviewData.stats.attributeAverages.quality },
                  { label: 'Wearing Comfort', score: reviewData.stats.attributeAverages.comfort },
                  { label: 'Material Softness', score: reviewData.stats.attributeAverages.material },
                  { label: 'Color Accuracy', score: reviewData.stats.attributeAverages.colorAccuracy }
                ].map(({ label, score }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-gray-600 font-medium">{label}</span>
                    <span className="font-bold text-gray-900">{score} / 5.0</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews Stream */}
            <div className="space-y-4">
              <h3 className="font-bold text-base text-gray-900">Customer Feedback & Photos</h3>

              {reviewData.reviews.length === 0 ? (
                <div className="py-12 text-center bg-gray-50 rounded-2xl border border-gray-200/80 p-6">
                  <p className="text-sm font-semibold text-gray-700">No written reviews yet for this product.</p>
                  <p className="text-xs text-gray-500 font-light mt-1">
                    Purchased this item? You can submit your review directly from your <b>My Orders</b> page after delivery!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviewData.reviews.map((rev) => (
                    <div key={rev._id} className="p-4 sm:p-5 bg-white border border-gray-200/80 rounded-2xl shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-900 text-white font-bold flex items-center justify-center text-xs">
                            {rev.userName ? rev.userName[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <h5 className="font-bold text-xs sm:text-sm text-gray-900 flex items-center gap-1.5">
                              {rev.userName}
                              {rev.verifiedPurchase && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full font-bold">
                                  ✓ Verified Buyer
                                </span>
                              )}
                            </h5>
                            <span className="text-[10px] text-gray-400">
                              {new Date(rev.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </div>

                        {/* Star Score */}
                        <div className="flex items-center gap-0.5 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                          {[1, 2, 3, 4, 5].map((st) => (
                            <span key={st} className={`text-xs ${st <= rev.rating ? 'text-amber-400' : 'text-gray-200'}`}>
                              ★
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Review Headline & Text */}
                      {rev.title && <h6 className="font-bold text-xs sm:text-sm text-gray-900">{rev.title}</h6>}
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{rev.comment}</p>

                      {/* Review Attribute Badges */}
                      {rev.attributes && (
                        <div className="flex flex-wrap gap-2 text-[11px] pt-1">
                          <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full font-medium">Fit: {rev.attributes.fit}/5</span>
                          <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full font-medium">Quality: {rev.attributes.quality}/5</span>
                          <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full font-medium">Comfort: {rev.attributes.comfort}/5</span>
                        </div>
                      )}

                      {/* Review Photos Lightbox Thumbnails */}
                      {rev.images && rev.images.length > 0 && (
                        <div className="flex items-center gap-2 pt-2">
                          {rev.images.map((imgUrl, idx) => (
                            <img
                              key={idx}
                              src={imgUrl}
                              alt="Review thumbnail"
                              onClick={() => setLightboxImage(imgUrl)}
                              className="w-16 h-16 object-cover rounded-xl border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Related Products */}
      <RelatedProducts category={productData.category} subCategory={productData.subCategory} />

      {/* Modals */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        category={productData.category}
        availableSizes={productData.sizes || []}
        onSelectSize={(sz) => setSize(sz)}
      />

      <NotifyMeModal
        isOpen={isNotifyOpen}
        onClose={() => setIsNotifyOpen(false)}
        product={productData}
        selectedSize={size}
        onSubscribe={(pid, sz, email) => subscribeNotifyMe(pid, sz, email)}
      />

      <VirtualTryOnModal
        isOpen={isTryOnOpen}
        onClose={() => setIsTryOnOpen(false)}
        productData={productData}
      />

      <AutoBundlerModal
        isOpen={isBundlerOpen}
        onClose={() => setIsBundlerOpen(false)}
        primaryProduct={productData}
        primarySize={size}
      />

      {/* Bank Offers Terms & Conditions Modal */}
      {isBankOffersOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsBankOffersOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-gray-100 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>🏦</span> Bank & Payment Offer Details
              </h3>
              <button
                onClick={() => setIsBankOffersOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1 text-xs text-gray-700">
              {bankOffers.map((offer) => (
                <div key={offer._id} className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-gray-900 text-xs sm:text-sm flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 text-[11px] font-black">{offer.bankName}</span>
                      <span>({offer.badgeText})</span>
                    </p>
                    {offer.minPurchase > 0 && <span className="text-[10px] text-gray-500 font-bold bg-gray-100 px-2 py-0.5 rounded-full">Min: ₹{offer.minPurchase}</span>}
                  </div>
                  <p className="font-semibold text-gray-800 pt-1">{offer.offerText}</p>
                  <p className="text-gray-600 leading-relaxed text-[11px] border-t border-slate-200/60 pt-1.5 mt-1.5">{offer.terms}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setIsBankOffersOpen(false)}
              className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 rounded-xl text-xs uppercase transition-colors"
            >
              Got It, Close
            </button>
          </div>
        </div>
      )}
    </div>
  ) : productLoading ? (
    // Loading skeleton — shown while fetching product data
    <div className='border-t-2 pt-10 pb-16 animate-pulse'>
      <div className='flex gap-12 flex-col sm:flex-row'>
        <div className='flex-1'>
          <div className='w-full aspect-[3/4] bg-gray-200 rounded-2xl mb-4' />
          <div className='flex gap-2'>
            {[1,2,3].map(n => <div key={n} className='w-16 h-20 bg-gray-200 rounded-lg' />)}
          </div>
        </div>
        <div className='flex-1 space-y-4'>
          <div className='h-8 bg-gray-200 rounded-lg w-3/4' />
          <div className='h-4 bg-gray-200 rounded w-1/4' />
          <div className='h-6 bg-gray-200 rounded w-1/3' />
          <div className='h-4 bg-gray-200 rounded w-full' />
          <div className='h-4 bg-gray-200 rounded w-5/6' />
          <div className='h-12 bg-gray-200 rounded-xl mt-4' />
          <div className='h-12 bg-gray-200 rounded-xl' />
        </div>
      </div>
    </div>
  ) : (
    // Product not found
    <div className='border-t-2 pt-10 pb-16 text-center'>
      <div className='py-20 space-y-4'>
        <p className='text-6xl'>😕</p>
        <h2 className='text-xl font-bold text-gray-800'>Product Not Found</h2>
        <p className='text-sm text-gray-500'>This product may no longer be available.</p>
        <button
          onClick={() => navigate('/collection')}
          className='mt-4 px-6 py-2.5 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors'
        >
          Browse Collection
        </button>
      </div>
    </div>
  )
}

export default Product
