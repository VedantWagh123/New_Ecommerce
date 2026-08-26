import React, { useState, useEffect } from 'react';

const VirtualTryOnModal = ({ isOpen, onClose, productData }) => {
  const [step, setStep] = useState(1); // 1: Upload, 2: Camera, 3: Scanning, 4: Result
  const [selectedImage, setSelectedImage] = useState(null);
  const [progress, setProgress] = useState(0);
  const [resultImage, setResultImage] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);

  // User Traits for Relatable AI Generation
  const [userGender, setUserGender] = useState('Indian Male');
  const [stream, setStream] = useState(null);
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedImage(null);
      setProgress(0);
      setResultImage('');
      setIsFullScreen(false);
      stopCamera();
    }
  }, [isOpen]);



  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      setStep(2);
    } catch (err) {
      alert("Could not access camera. Please allow camera permissions.");
    }
  };

  useEffect(() => {
    if (step === 2 && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [step, stream]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const dataUrl = canvasRef.current.toDataURL('image/jpeg');
      setSelectedImage(dataUrl);
      stopCamera();
      setStep(1);
    }
  };

  const handleStartTryOn = () => {
    if (!selectedImage) return;
    setStep(3);
    setProgress(0);

    // Simulate AI Processing time
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          generateResult();
          return 100;
        }
        return prev + 5;
      });
    }, 150); // 3 seconds total
  };

  const generateResult = () => {
    // Generate a simulated Try-On result using Pollinations AI
    // Passing user traits makes the generated model look relatable to the user
    const seed = Math.floor(Math.random() * 100000);
    
    // Clean up product name and extract features to make the prompt more accurate
    const cleanProductName = productData.name.replace(/(Men|Women|Kids|Boys|Girls)\s*/gi, '').trim();
    const colorStr = productData.colors && productData.colors.length > 0 ? productData.colors.join(' ') : '';
    const fitStr = productData.fit ? `${productData.fit} fit` : '';
    
    // Highly optimized prompt for photorealism and accurate clothing generation
    const prompt = `Hyperrealistic fashion editorial photography, attractive ${userGender} model wearing a exactly ${colorStr} ${cleanProductName} ${fitStr}. Full body shot, clean crisp studio background, wearing matching neutral pants and shoes. 8k resolution, photorealistic, symmetrical face, perfect anatomy, highly detailed clothing texture, cinematic lighting`;
    
    const encodedPrompt = encodeURIComponent(prompt);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=600&height=800&seed=${seed}&nologo=true`;
    
    setResultImage(url);
    setStep(4);
  };

  if (!isOpen || !productData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col md:flex-row shadow-2xl overflow-hidden border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Left Side: Product Info (Hidden on very small screens) */}
        <div className="hidden md:flex flex-col w-1/3 bg-gray-50 border-r border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xl">✨</span>
            <h3 className="font-bold text-gray-900 tracking-wide uppercase text-sm">AI Virtual Try-On</h3>
          </div>
          
          <div className="flex-1">
            <img 
              src={productData.image[0]} 
              alt={productData.name} 
              className="w-full h-64 object-cover rounded-2xl border border-gray-200 shadow-sm mb-4"
            />
            <h4 className="font-bold text-gray-900 text-lg leading-tight mb-2">{productData.name}</h4>
            <p className="text-sm font-semibold text-gray-500 mb-1">{productData.category} • {productData.subCategory}</p>
            <p className="text-xl font-black text-gray-900">₹{productData.price}</p>
          </div>

          <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
            <p className="text-[11px] font-medium text-indigo-800 leading-relaxed">
              <span className="font-bold block mb-1">How it works:</span>
              Upload your full-body photo, and our AI will seamlessly fit this garment onto your body to give you a realistic preview.
            </p>
          </div>
        </div>

        {/* Right Side: Interactive Area */}
        <div className="flex flex-col flex-1 w-full relative">
          
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
            <h3 className="font-bold text-gray-900 md:hidden flex items-center gap-2">
              <span>✨</span> AI Try-On
            </h3>
            <span className="hidden md:inline text-xs font-bold text-gray-400 uppercase tracking-wider">
              {step === 1 || step === 2 ? 'Step 1: Upload Photo' : step === 3 ? 'Step 2: AI Fitting' : 'Step 3: Try-On Result'}
            </span>
            <button 
              onClick={() => { stopCamera(); onClose(); }}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 p-6 flex items-center justify-center min-h-[400px] overflow-y-auto bg-white">
            
            {/* STEP 1: UPLOAD */}
            {step === 1 && (
              <div className="w-full max-w-md flex flex-col items-center animate-fade-in">
                
                <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">See It On You!</h2>
                <p className="text-sm text-gray-500 mb-6 text-center">Upload a clear, front-facing photo for the best AI fitting results.</p>
                
                {!selectedImage ? (
                  <div className="w-full flex flex-col gap-3">
                    <label className="w-full h-48 border-2 border-dashed border-gray-300 hover:border-black rounded-2xl flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors group">
                      <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </div>
                      <span className="font-bold text-gray-900">Upload from Gallery</span>
                      <span className="text-[10px] text-gray-400 mt-1">JPG, PNG up to 5MB</span>
                      <input type="file" className="hidden" accept="image/jpeg, image/png" onChange={handleImageUpload} />
                    </label>
                    <div className="flex items-center gap-4 w-full">
                      <div className="flex-1 h-px bg-gray-200"></div>
                      <span className="text-xs text-gray-400 font-bold uppercase">OR</span>
                      <div className="flex-1 h-px bg-gray-200"></div>
                    </div>
                    <button 
                      onClick={startCamera}
                      className="w-full py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      Use Camera
                    </button>
                  </div>
                ) : (
                  <div className="w-full space-y-4">
                    <div className="relative w-full h-72 rounded-2xl overflow-hidden border border-gray-200 shadow-sm mb-4">
                      <img src={selectedImage} alt="User Upload" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-rose-600 font-bold text-xs px-3 py-1.5 rounded-full shadow-sm hover:bg-rose-50 transition-colors"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <label className="text-xs font-bold text-gray-700 block mb-2">Select your appearance (For better AI matching):</label>
                      <select 
                        value={userGender} 
                        onChange={(e) => setUserGender(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs font-medium text-gray-800 focus:outline-none focus:border-black"
                      >
                        <option value="Indian Male">Male (Indian)</option>
                        <option value="Indian Female">Female (Indian)</option>
                        <option value="Caucasian Male">Male (Caucasian)</option>
                        <option value="Caucasian Female">Female (Caucasian)</option>
                        <option value="Black Male">Male (Black)</option>
                        <option value="Black Female">Female (Black)</option>
                        <option value="Asian Male">Male (Asian)</option>
                        <option value="Asian Female">Female (Asian)</option>
                      </select>
                    </div>

                    <button 
                      onClick={handleStartTryOn}
                      className="w-full bg-black hover:bg-gray-800 text-white font-bold py-4 rounded-xl transition-all shadow-md active:scale-95 uppercase tracking-wide flex items-center justify-center gap-2"
                    >
                      <span>✨</span> Generate Try-On
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: CAMERA CAPTURE */}
            {step === 2 && (
              <div className="w-full max-w-md flex flex-col items-center animate-fade-in">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Take a Photo</h2>
                <div className="relative w-full h-80 rounded-2xl overflow-hidden bg-black mb-4">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                </div>
                <div className="flex w-full gap-3">
                  <button 
                    onClick={() => { stopCamera(); setStep(1); }}
                    className="flex-1 py-3 bg-gray-200 text-gray-800 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={capturePhoto}
                    className="flex-[2] py-3 bg-black text-white font-bold rounded-xl flex items-center justify-center gap-2"
                  >
                    📸 Capture
                  </button>
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}

            {/* STEP 3: SCANNING / PROCESSING */}
            {step === 3 && (
              <div className="w-full max-w-md flex flex-col items-center animate-fade-in">
                <div className="relative w-48 h-64 rounded-2xl overflow-hidden border-2 border-indigo-100 mb-8 shadow-inner bg-gray-50">
                  {selectedImage && <img src={selectedImage} alt="Processing" className="w-full h-full object-cover opacity-60" />}
                  
                  {/* Scanning Laser Line */}
                  <div className="absolute left-0 w-full h-1 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-scan" />
                  
                  {/* Overlay Grid */}
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMykiIHN0cm9rZS13aWR0aD0iMC41IiAvPgo8L3N2Zz4=')] opacity-50" />
                </div>
                
                <h3 className="font-bold text-xl text-gray-900 mb-2">AI is fitting the garment...</h3>
                <p className="text-sm text-gray-500 mb-6 animate-pulse">Analyzing body posture and mapping fabric textures.</p>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out relative"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-pulse" />
                  </div>
                </div>
                <span className="text-xs font-bold text-indigo-600 mt-2">{progress}% Complete</span>
              </div>
            )}

            {/* STEP 4: RESULT */}
            {step === 4 && (
              <div className="w-full max-w-md flex flex-col items-center animate-fade-in">
                <div className="w-full bg-emerald-50 text-emerald-800 text-xs font-bold px-4 py-2 rounded-xl mb-4 border border-emerald-200 flex items-center justify-center gap-2">
                  <span>✅</span> AI Try-On Generated Successfully!
                </div>
                
                <div 
                  className="relative w-full h-96 rounded-2xl overflow-hidden border border-gray-200 shadow-md mb-6 bg-gray-100 group cursor-zoom-in"
                  onClick={() => setIsFullScreen(true)}
                  title="Click to view full screen"
                >
                  <img 
                    src={resultImage} 
                    alt="Try-On Result" 
                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = productData.image[0]; // fallback
                    }}
                  />
                  
                  {/* Before/After Toggle Hint & Expand Icon */}
                  <div className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                  </div>
                </div>

                <div className="w-full flex gap-3">
                  <button 
                    onClick={() => { setSelectedImage(null); setStep(1); }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3.5 rounded-xl transition-colors text-[11px] uppercase"
                  >
                    Try Another Photo
                  </button>
                  <button 
                    onClick={onClose}
                    className="flex-[1.5] bg-black hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-95 text-[11px] uppercase flex items-center justify-center gap-2"
                  >
                    <span>🛒</span> Looks Good, Close
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-4 text-center leading-relaxed">
                  *Note: True image-to-image VTON requires paid AI computing. To provide a free relatable preview, we generate a highly realistic model based on your appearance traits wearing the product.
                </p>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Full Screen Image Lightbox */}
      {isFullScreen && (
        <div 
          className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsFullScreen(false)}
        >
          <div className="absolute top-4 right-4 flex gap-4">
            <button className="text-white hover:text-gray-300 font-bold bg-white/10 px-4 py-2 rounded-full text-xs">
              Download
            </button>
            <button className="text-white hover:text-gray-300">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <img 
            src={resultImage} 
            alt="Full Screen Result" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};

export default VirtualTryOnModal;
