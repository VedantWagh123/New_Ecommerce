import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';
import CartTotal from '../components/CartTotal';
import ProductItem from '../components/ProductItem';
import { toast } from 'react-toastify';

const Cart = () => {
  const { 
    products, 
    currency, 
    cartItems, 
    updateQuantity, 
    navigate, 
    savedForLater, 
    addToSavedForLater, 
    moveToCartFromSaved, 
    removeFromSavedForLater,
    couponData,
    setCouponData,
    applyCouponCode
  } = useContext(ShopContext);

  const [cartData, setCartData] = useState([]);
  const [couponInput, setCouponInput] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  useEffect(() => {
    if (products.length > 0) {
      const tempData = [];
      for (const items in cartItems) {
        for (const item in cartItems[items]) {
          if (cartItems[items][item] > 0) {
            tempData.push({
              _id: items,
              size: item,
              quantity: cartItems[items][item]
            });
          }
        }
      }
      setCartData(tempData);
    }
  }, [cartItems, products]);

  const handleCheckout = () => {
    if (cartData.length === 0) {
      toast.error('Your cart is empty. Add a product to continue.');
      return;
    }
    navigate('/place-order');
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setIsApplyingCoupon(true);
    const success = await applyCouponCode(couponInput);
    if (success) setCouponInput('');
    setIsApplyingCoupon(false);
  };

  const isCartEmpty = cartData.length === 0;

  return (
    <div className='border-t pt-10 pb-20 min-h-[85vh]'>
      <div className='flex items-center justify-between mb-8'>
        <div className='text-2xl sm:text-3xl font-bold tracking-tight'>
          <Title text1={'SHOPPING'} text2={'CART'} />
        </div>
        {!isCartEmpty && (
          <span className='text-sm text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full'>
            {cartData.reduce((acc, curr) => acc + curr.quantity, 0)} {cartData.reduce((acc, curr) => acc + curr.quantity, 0) === 1 ? 'Item' : 'Items'}
          </span>
        )}
      </div>

      {isCartEmpty ? (
        /* Empty Cart State & Recommendation Grid */
        <div className='flex flex-col items-center justify-center py-12 px-4'>
          <div className='w-24 h-24 mb-6 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 shadow-sm'>
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>Your cart is empty</h2>
          <p className='text-gray-500 max-w-md text-center mb-8 text-sm sm:text-base'>
            Looks like you haven't added anything to your cart yet. Explore our top collection and find something you'll love!
          </p>
          <button 
            onClick={() => navigate('/collection')} 
            className='bg-black hover:bg-gray-800 text-white font-medium px-8 py-3.5 rounded-xl shadow-md transition-all duration-200 active:scale-95 text-sm uppercase tracking-wider mb-16'
          >
            Explore Collection
          </button>

          {/* Recommended Products Grid */}
          {products.length > 0 && (
            <div className='w-full pt-10 border-t'>
              <div className='text-center mb-8'>
                <h3 className='text-xl font-bold text-gray-900'>Popular Picks For You</h3>
                <p className='text-sm text-gray-500 mt-1'>Add trending items directly to your bag</p>
              </div>
              <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6'>
                {products.slice(0, 5).map((item) => (
                  <ProductItem 
                    key={item._id} 
                    id={item._id} 
                    image={item.image} 
                    name={item.name} 
                    price={item.price} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Cart Items & Summary Layout */
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
          {/* Left Column: Cart Items List */}
          <div className='lg:col-span-7 xl:col-span-8 flex flex-col gap-4'>
            {cartData.map((item, index) => {
              const productData = products.find((product) => product._id === item._id);
              if (!productData) return null;

              const mrp = productData.mrp || Math.round(productData.price * 1.25);
              const discountPercent = Math.round(((mrp - productData.price) / mrp) * 100);
              const itemSubtotal = (productData.price * item.quantity).toFixed(2);

              return (
                <div 
                  key={`${item._id}-${item.size}`} 
                  className='p-4 sm:p-5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'
                >
                  {/* Image and Product Meta */}
                  <div className='flex items-start gap-4 w-full sm:w-auto'>
                    <div 
                      onClick={() => navigate(`/product/${productData._id}`)}
                      className='w-20 h-24 sm:w-24 sm:h-28 bg-gray-50 rounded-lg overflow-hidden shrink-0 border border-gray-100 cursor-pointer group'
                    >
                      <img 
                        className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300' 
                        src={productData.image[0]} 
                        alt={productData.name} 
                      />
                    </div>

                    <div className='flex-1 flex flex-col justify-between min-h-[90px]'>
                      <div>
                        <p 
                          onClick={() => navigate(`/product/${productData._id}`)}
                          className='text-sm sm:text-base font-semibold text-gray-900 hover:text-gray-700 cursor-pointer line-clamp-1'
                        >
                          {productData.name}
                        </p>
                        <p className='text-xs text-gray-500 mt-0.5 capitalize'>
                          {productData.category} • {productData.subCategory || 'Fashion'}
                        </p>
                        <div className='inline-flex items-center gap-1.5 mt-2 bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-md'>
                          <span>Size:</span>
                          <span className='font-bold text-black'>{item.size}</span>
                        </div>
                      </div>

                      {/* Price & Discount display */}
                      <div className='flex items-center gap-2 mt-3'>
                        <span className='text-base sm:text-lg font-bold text-black'>
                          {currency}{productData.price}
                        </span>
                        {mrp > productData.price && (
                          <>
                            <span className='text-xs sm:text-sm text-gray-400 line-through'>
                              {currency}{mrp}
                            </span>
                            <span className='text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded'>
                              {discountPercent}% OFF
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: Quantity Selector & Remove / Save */}
                  <div className='flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 gap-4'>
                    {/* Quantity controls */}
                    <div className='flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50'>
                      <button 
                        onClick={() => updateQuantity(item._id, item.size, item.quantity - 1)}
                        className='w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors font-bold text-sm'
                        title="Decrease quantity"
                      >
                        −
                      </button>
                      <span className='w-10 text-center font-semibold text-sm text-gray-900 bg-white border-x border-gray-200 py-1.5'>
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => updateQuantity(item._id, item.size, item.quantity + 1)}
                        className='w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors font-bold text-sm'
                        title="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    {/* Subtotal preview */}
                    <div className='text-right hidden sm:block'>
                      <p className='text-xs text-gray-400 uppercase tracking-wider font-medium'>Subtotal</p>
                      <p className='text-sm font-bold text-gray-900'>{currency}{itemSubtotal}</p>
                    </div>

                    {/* Save & Remove Buttons */}
                    <div className='flex items-center gap-3 text-xs text-gray-500 font-medium'>
                      <button 
                        onClick={() => addToSavedForLater(item._id, item.size)}
                        className='hover:text-black flex items-center gap-1 transition-colors'
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        Save
                      </button>
                      <span className='text-gray-300'>|</span>
                      <button 
                        onClick={() => updateQuantity(item._id, item.size, 0)}
                        className='hover:text-red-600 flex items-center gap-1 transition-colors'
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Order Summary & Checkout CTA */}
          <div className='lg:col-span-5 xl:col-span-4 sticky top-24'>
            
            {/* Coupon Input Area */}
            <div className='w-full bg-white rounded-xl border border-gray-100 p-5 shadow-sm mb-4'>
                <h3 className='text-sm font-bold text-gray-900 mb-3'>Have a Coupon Code?</h3>
                <div className='flex items-center gap-2'>
                    <input 
                        type="text" 
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="ENTER CODE" 
                        className='flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase outline-none focus:border-black transition-colors'
                    />
                    <button 
                        onClick={handleApplyCoupon}
                        disabled={isApplyingCoupon || !couponInput.trim()}
                        className='bg-black hover:bg-gray-800 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        {isApplyingCoupon ? '...' : 'APPLY'}
                    </button>
                </div>
                {couponData?.discount > 0 && (
                    <div className='mt-3 flex items-center justify-between bg-emerald-50 text-emerald-700 px-3 py-2.5 rounded-md text-xs font-medium border border-emerald-100'>
                        <span className='flex items-center gap-1.5'>
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                            Code '{couponData.code}' applied!
                        </span>
                        <button onClick={() => setCouponData({ code: '', discount: 0 })} className='text-emerald-800 hover:text-emerald-900 font-bold'>REMOVE</button>
                    </div>
                )}
            </div>

            <CartTotal />
            
            <div className='w-full mt-4'>
              <button 
                onClick={handleCheckout} 
                disabled={isCartEmpty}
                className={`w-full py-4 rounded-xl font-bold tracking-wider text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md ${
                  isCartEmpty 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-70 shadow-none' 
                    : 'bg-black text-white hover:bg-gray-800 active:scale-[0.99] cursor-pointer'
                }`}
              >
                <span>PROCEED TO CHECKOUT</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
              {isCartEmpty && (
                <p className='text-xs text-center text-red-500 mt-2 font-medium'>
                  Your cart is empty. Add a product to continue.
                </p>
              )}
            </div>

            {/* Security Badges */}
            <div className='mt-6 grid grid-cols-2 gap-3 text-center text-xs text-gray-500 font-medium border-t pt-4'>
              <div className='flex items-center justify-center gap-1.5 p-2 bg-gray-50 rounded-lg'>
                <svg className="w-4 h-4 text-gray-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>100% Secure Checkout</span>
              </div>
              <div className='flex items-center justify-center gap-1.5 p-2 bg-gray-50 rounded-lg'>
                <svg className="w-4 h-4 text-gray-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                </svg>
                <span>Easy Returns & Exchange</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Saved For Later Section */}
      {savedForLater && savedForLater.length > 0 && (
        <div className='mt-16 border-t pt-10'>
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h3 className='text-xl font-bold text-gray-900'>Saved For Later ({savedForLater.length})</h3>
              <p className='text-sm text-gray-500'>Items you set aside for future purchases</p>
            </div>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
            {savedForLater.map((savedItem) => {
              const productData = products.find((p) => p._id === savedItem._id);
              if (!productData) return null;

              return (
                <div key={`${savedItem._id}-${savedItem.size}`} className='p-4 bg-white border border-gray-100 rounded-xl flex items-center gap-4 shadow-sm'>
                  <img className='w-16 h-20 object-cover rounded-lg bg-gray-50 shrink-0' src={productData.image[0]} alt={productData.name} />
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-semibold text-gray-900 truncate'>{productData.name}</p>
                    <p className='text-xs text-gray-500 mt-0.5'>Size: {savedItem.size}</p>
                    <p className='text-sm font-bold text-black mt-1'>{currency}{productData.price}</p>

                    <div className='flex items-center gap-3 mt-3 text-xs'>
                      <button 
                        onClick={() => moveToCartFromSaved(savedItem._id, savedItem.size)}
                        className='text-black font-semibold hover:underline'
                      >
                        Move to Cart
                      </button>
                      <span className='text-gray-300'>|</span>
                      <button 
                        onClick={() => removeFromSavedForLater(savedItem._id, savedItem.size)}
                        className='text-red-500 hover:underline'
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
