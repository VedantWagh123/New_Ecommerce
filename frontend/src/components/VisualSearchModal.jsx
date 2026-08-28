import React, { useState, useRef, useEffect, useContext } from 'react';
import axios from 'axios';
import { ShopContext } from '../context/ShopContext';
import ProductItem from './ProductItem';
import { validateImageQuality, extractImageFeatures, matchCatalogProducts } from '../utils/visualAI';

const VisualSearchModal = ({ isOpen, onClose }) => {
    const { products, navigate, backendUrl } = useContext(ShopContext);


    const [mode, setMode] = useState('CHOICE'); // 'CHOICE' | 'CAMERA' | 'PREVIEW' | 'SEARCHING' | 'RESULTS' | 'INVALID_IMAGE'
    const [selectedImage, setSelectedImage] = useState(null);
    const [userFeatures, setUserFeatures] = useState(null);
    const [similarProducts, setSimilarProducts] = useState([]);
    const [searchStep, setSearchStep] = useState('Validating Image...');
    const [errorMsg, setErrorMsg] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);
    const [scanningText, setScanningText] = useState('Initializing Lumi Lens...');

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const fileInputRef = useRef(null);

    // Dynamic scanning texts loop
    useEffect(() => {
        let intervalId;
        if (mode === 'SEARCHING') {
            const texts = [
                'Initializing Lumi Lens...',
                'Extracting Colors & Patterns...',
                'Analyzing Fabric & Fit...',
                'Scanning Store Catalogue...',
                'Matching Style Signatures...',
                'Finalizing Results...'
            ];
            let i = 0;
            intervalId = setInterval(() => {
                i = (i + 1) % texts.length;
                setScanningText(texts[i]);
            }, 2500); // Change text every 2.5 seconds
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [mode]);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            stopCamera();
            setMode('CHOICE');
            setSelectedImage(null);
            setUserFeatures(null);
            setSimilarProducts([]);
            setErrorMsg('');
        }
    }, [isOpen]);

    // Clean up camera stream on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const startCamera = async () => {
        setErrorMsg('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            streamRef.current = stream;
            setMode('CAMERA');
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            }, 100);
        } catch (err) {
            console.error('Camera access error:', err);
            setErrorMsg('Camera access was denied or is unsupported on this device. Fallback to file upload mode.');
        }
    };

    const capturePhoto = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        // Downscale camera capture to prevent local LLM from choking on huge images
        let width = video.videoWidth || 640;
        let height = video.videoHeight || 480;
        const maxWidth = 800;
        const maxHeight = 800;
        
        if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        stopCamera();
        await validateAndPreviewImage(dataUrl);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    const downscaleImage = (dataUrl, maxWidth, maxHeight) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                // Lower quality to 0.8 to compress image further for LLM API
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.src = dataUrl;
        });
    };

    const processFile = (file) => {
        if (!file.type.startsWith('image/')) {
            setErrorMsg('Please select a valid image file (JPG, PNG, WEBP).');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setErrorMsg('File size exceeds 10MB limit. Please choose a smaller image.');
            return;
        }
        setErrorMsg('');
        const reader = new FileReader();
        reader.onload = async (event) => {
            const dataUrl = event.target?.result;
            if (dataUrl) {
                const resizedDataUrl = await downscaleImage(dataUrl, 800, 800);
                await validateAndPreviewImage(resizedDataUrl);
            }
        };
        reader.readAsDataURL(file);
    };

    const validateAndPreviewImage = async (dataUrl) => {
        setSelectedImage(dataUrl);
        setSearchStep('Validating image quality...');
        const valResult = await validateImageQuality(dataUrl);

        if (!valResult.valid) {
            setErrorMsg(valResult.reason);
            setMode('INVALID_IMAGE');
            return;
        }

        setUserFeatures(valResult.features);
        setMode('PREVIEW');
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    const handlePerformSearch = async () => {
        if (!selectedImage) return;
        setMode('SEARCHING');
        setErrorMsg('');

        try {
            setSearchStep('Analyzing image with Vision AI...');
            
            let finalMatches = [];
            let apiSuccess = false;
            try {
                const response = await axios.post(`${backendUrl}/api/ai/visual-search`, {
                    image: selectedImage
                });

                if (response.data && response.data.success) {
                    if (response.data.isFashionItem === false) {
                        // explicitly not a fashion item, no need for fallback
                        apiSuccess = true;
                        finalMatches = [];
                    } else if (response.data.products && response.data.products.length > 0) {
                        apiSuccess = true;
                        finalMatches = response.data.products;
                    }
                    // If isFashionItem is true but products are empty, apiSuccess remains false, triggering local fallback!
                }
            } catch (err) {
                console.warn('Backend visual search failed:', err.message);
            }

            if (!apiSuccess && userFeatures && products && products.length > 0) {
                setSearchStep('Extracting visual features locally...');
                // Allow UI to update before heavy local processing
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Fallback to local heuristic search (visual similarity)
                const localMatches = await matchCatalogProducts(userFeatures, products, 65);
                finalMatches = localMatches;
            }

            setSimilarProducts(finalMatches);
            setMode('RESULTS');
        } catch (err) {
            console.warn('Visual search notice:', err.message);
            setSimilarProducts([]);
            setMode('RESULTS');
        }
    };


    const handleProductClick = (productId) => {
        onClose();
        navigate(`/product/${productId}`);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div 
                className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 my-auto custom-scrollbar scroll-smooth"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 bg-gray-50/90 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                                ✨ Lumi Lens
                            </h2>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-black text-white">
                                Store Catalog Match
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Upload a photo or capture an image to find visually similar clothing in our store
                        </p>
                    </div>

                    <button 
                        onClick={() => {
                            stopCamera();
                            onClose();
                        }}
                        className="w-9 h-9 rounded-full bg-white hover:bg-gray-200 border border-gray-200 flex items-center justify-center text-gray-600 transition-colors shadow-2xs cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                {/* Hidden canvas for photo capture */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Modal Body */}
                <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-white space-y-5 custom-scrollbar scroll-smooth">
                    {/* Error Banner */}
                    {errorMsg && mode !== 'INVALID_IMAGE' && (
                        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium flex items-center justify-between">
                            <span>⚠️ {errorMsg}</span>
                            <button onClick={() => setErrorMsg('')} className="text-rose-500 hover:text-rose-900 font-bold ml-2 cursor-pointer">✕</button>
                        </div>
                    )}

                    {/* MODE 1: CHOICE (Upload or Camera) */}
                    {mode === 'CHOICE' && (
                        <div className="space-y-6">
                            <div 
                                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                                onDragLeave={() => setIsDragOver(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`relative group overflow-hidden border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-300 ease-out ${
                                    isDragOver 
                                        ? 'border-indigo-500 bg-indigo-50/50 scale-[1.02] shadow-lg' 
                                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50/80 hover:shadow-md'
                                }`}
                            >
                                {/* Animated background glow on hover */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-50/0 via-purple-50/0 to-pink-50/0 group-hover:from-indigo-50/40 group-hover:via-purple-50/40 group-hover:to-pink-50/40 transition-colors duration-500 rounded-3xl pointer-events-none" />
                                
                                <input 
                                    ref={fileInputRef} 
                                    type="file" 
                                    accept="image/jpeg,image/png,image/webp" 
                                    onChange={handleFileSelect} 
                                    className="hidden" 
                                />
                                <div className="w-16 h-16 bg-white shadow-sm border border-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-300">
                                    <span className="drop-shadow-sm">✨</span>
                                </div>
                                <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-900 transition-colors">Upload Product Image</h3>
                                <p className="text-sm text-gray-500 mt-2 relative z-10">
                                    Drag & drop your clothing photo here, or <span className="text-indigo-600 font-bold underline decoration-indigo-200 underline-offset-2 group-hover:decoration-indigo-500 transition-all">browse files</span>
                                </p>
                                <span className="inline-block mt-4 px-4 py-1.5 bg-white border border-gray-100 shadow-sm text-gray-500 text-xs font-semibold rounded-full group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors relative z-10">
                                    Supports JPG, PNG, WEBP (Max 10MB)
                                </span>
                            </div>

                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-gray-200"></div>
                                <span className="flex-shrink mx-4 text-xs font-bold text-gray-400 uppercase tracking-widest bg-white px-2 rounded-full">OR</span>
                                <div className="flex-grow border-t border-gray-200"></div>
                            </div>

                            <button
                                onClick={startCamera}
                                className="w-full relative overflow-hidden bg-gray-900 text-white font-bold py-4 px-4 rounded-2xl text-sm transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-3 cursor-pointer group"
                            >
                                {/* Button hover shimmer effect */}
                                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
                                <span className="text-lg group-hover:scale-110 transition-transform">📷</span> 
                                <span>Open Camera & Capture Photo</span>
                            </button>
                        </div>
                    )}

                    {/* MODE 2: CAMERA STREAM */}
                    {mode === 'CAMERA' && (
                        <div className="space-y-4 text-center">
                            <div className="relative rounded-3xl overflow-hidden bg-black aspect-4/3 max-h-80 mx-auto border border-gray-200 shadow-inner flex items-center justify-center">
                                <video 
                                    ref={videoRef} 
                                    autoPlay 
                                    playsInline 
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-4 border-2 border-white/40 border-dashed rounded-2xl pointer-events-none flex items-center justify-center">
                                    <span className="bg-black/60 text-white text-[11px] px-3 py-1 rounded-full font-medium backdrop-blur-xs">
                                        Center clothing item in frame
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-3">
                                <button
                                    onClick={() => {
                                        stopCamera();
                                        setMode('CHOICE');
                                    }}
                                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={capturePhoto}
                                    className="px-6 py-2.5 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                                >
                                    <span>📸</span> Capture Photo
                                </button>
                            </div>
                        </div>
                    )}

                    {/* MODE 3: PREVIEW */}
                    {mode === 'PREVIEW' && selectedImage && (
                        <div className="space-y-4 text-center">
                            <div className="relative max-h-72 w-full max-w-sm mx-auto rounded-3xl overflow-hidden border border-gray-200 shadow-xs bg-gray-50 p-2">
                                <img 
                                    src={selectedImage} 
                                    alt="Uploaded Search Preview" 
                                    className="w-full h-64 object-contain rounded-2xl"
                                />
                            </div>

                            <div className="flex items-center justify-center gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        setSelectedImage(null);
                                        setUserFeatures(null);
                                        setMode('CHOICE');
                                    }}
                                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                                >
                                    ↺ Retake / Remove
                                </button>
                                <button
                                    onClick={handlePerformSearch}
                                    className="px-6 py-2.5 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                                >
                                    <span>🔍</span> Find Similar Products
                                </button>
                            </div>
                        </div>
                    )}

                    {/* MODE 4: INVALID IMAGE QUALITY CHECK */}
                    {mode === 'INVALID_IMAGE' && (
                        <div className="p-8 text-center bg-gray-50 border border-gray-200 rounded-3xl space-y-4">
                            <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-2xl text-rose-600">
                                ⚠️
                            </div>
                            <h3 className="text-base font-bold text-gray-900">We couldn't identify a product in this image</h3>
                            <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                                {errorMsg || "Please ensure the clothing item is clearly visible and well-lit."}
                            </p>
                            <button
                                onClick={() => {
                                    setSelectedImage(null);
                                    setUserFeatures(null);
                                    setErrorMsg('');
                                    setMode('CHOICE');
                                }}
                                className="bg-black hover:bg-gray-800 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-colors cursor-pointer"
                            >
                                Upload Another Image
                            </button>
                        </div>
                    )}

                    {/* MODE 5: SEARCHING LOADER */}
                    {mode === 'SEARCHING' && (
                        <div className="py-8 text-center space-y-6 relative">
                            <div className="relative max-w-sm mx-auto rounded-3xl overflow-hidden shadow-md">
                                {/* Base Image */}
                                <img 
                                    src={selectedImage} 
                                    alt="Scanning..." 
                                    className="w-full h-80 object-cover brightness-75"
                                />
                                
                                {/* Google Lens style white dots container */}
                                <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                                    {/* Pulsating dots scattered around */}
                                    <div className="absolute top-[30%] left-[40%] w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_10px_3px_rgba(255,255,255,0.8)] animate-[pulse-dot_1.5s_infinite]"></div>
                                    <div className="absolute top-[60%] left-[25%] w-3 h-3 bg-white rounded-full shadow-[0_0_10px_3px_rgba(255,255,255,0.8)] animate-[pulse-dot_2s_infinite_0.3s]"></div>
                                    <div className="absolute top-[45%] right-[30%] w-2 h-2 bg-white rounded-full shadow-[0_0_10px_3px_rgba(255,255,255,0.8)] animate-[pulse-dot_1.8s_infinite_0.7s]"></div>
                                    <div className="absolute top-[20%] right-[20%] w-3 h-3 bg-white rounded-full shadow-[0_0_10px_3px_rgba(255,255,255,0.8)] animate-[pulse-dot_2.2s_infinite_0.1s]"></div>
                                    <div className="absolute bottom-[25%] right-[40%] w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_10px_3px_rgba(255,255,255,0.8)] animate-[pulse-dot_1.6s_infinite_0.5s]"></div>
                                    
                                    {/* A subtle scanning light wave that moves up and down */}
                                    <div className="absolute left-0 right-0 h-[30vh] bg-gradient-to-b from-transparent via-white/20 to-transparent animate-[scan-wave_3s_ease-in-out_infinite]"></div>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-gray-800">
                                    {scanningText}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Looking for similar items...
                                </p>
                            </div>
                            
                            {/* Inline style for the scan keyframes */}
                            <style>{`
                                @keyframes pulse-dot {
                                    0%, 100% { opacity: 0.3; transform: scale(0.8); }
                                    50% { opacity: 1; transform: scale(1.5); }
                                }
                                @keyframes scan-wave {
                                    0% { transform: translateY(-100%); }
                                    50% { transform: translateY(100%); }
                                    100% { transform: translateY(-100%); }
                                }
                                @keyframes shimmer {
                                    100% { transform: translateX(200%); }
                                }
                                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                                .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
                                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
                            `}</style>
                        </div>
                    )}

                    {/* MODE 6: RESULTS OR STRICT NO-MATCH */}
                    {mode === 'RESULTS' && (
                        <div className="space-y-4">
                            {similarProducts.length === 0 ? (
                                /* STRICT NO-MATCH REQUIREMENT */
                                <div className="p-10 text-center bg-gray-50 border border-gray-200 rounded-3xl space-y-3">
                                    <div className="w-14 h-14 bg-gray-200/80 rounded-full flex items-center justify-center mx-auto text-2xl text-gray-500">
                                        👕
                                    </div>
                                    <h3 className="text-base font-bold text-gray-900">We couldn't find a similar product</h3>
                                    <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                                        Try another image with the clothing item clearly visible.
                                    </p>
                                    <button
                                        onClick={() => {
                                            setSelectedImage(null);
                                            setUserFeatures(null);
                                            setMode('CHOICE');
                                        }}
                                        className="bg-black hover:bg-gray-800 text-white text-xs font-bold px-6 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
                                    >
                                        Upload Another Image
                                    </button>
                                </div>
                            ) : (
                                /* MATCHING RESULTS DISPLAY */
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-gray-900">
                                            Visually Similar Products ({similarProducts.length})
                                        </h3>
                                        <button
                                            onClick={() => {
                                                setSelectedImage(null);
                                                setUserFeatures(null);
                                                setMode('CHOICE');
                                            }}
                                            className="text-xs font-bold text-gray-600 hover:text-black underline cursor-pointer"
                                        >
                                            Search Another Image
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-96 overflow-y-auto p-1 custom-scrollbar scroll-smooth pb-4">
                                        {similarProducts.map((item) => (
                                            <div 
                                                key={item._id} 
                                                onClick={() => handleProductClick(item._id)}
                                                className="cursor-pointer group"
                                            >
                                                <ProductItem 
                                                    id={item._id} 
                                                    image={item.image} 
                                                    name={item.name} 
                                                    price={item.price} 
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500 shrink-0">
                    <span>🔒 Private AI Catalog Match</span>
                    <button
                        onClick={() => {
                            stopCamera();
                            onClose();
                        }}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VisualSearchModal;
