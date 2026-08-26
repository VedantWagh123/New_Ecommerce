import React, { useEffect } from 'react';

const SellerRegisterRedirect = () => {
  useEffect(() => {
    window.location.href = 'http://localhost:5175';
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 space-y-4">
      <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      <h2 className="text-lg font-bold text-gray-800">Redirecting to Seller Hub...</h2>
      <p className="text-xs text-gray-500">Please wait while we transfer you to the Seller Partner Portal.</p>
    </div>
  );
};

export default SellerRegisterRedirect;
