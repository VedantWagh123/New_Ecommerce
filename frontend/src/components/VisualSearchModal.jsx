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
    const [scanningText, setScanningText] = useState('Initializing AI Vision...');

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const fileInputRef = useRef(null);

    // Dynamic scanning texts loop
    useEffect(() => {
        let intervalId;
        if (mode === 'SEARCHING') {
            const texts = [
                'Initializing AI Vision...',
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
                        // explicitly not a fashion item
                        apiSuccess = true;
                        finalMatches = [];
                    } else if (response.data.products && response.data.products.length > 0) {
                        apiSuccess = true;
                        finalMatches = response.data.products;
                    }
                }
            } catch (err) {
                console.warn('Backend visual search failed:', err.message);
            }

            if (!apiSuccess && userFeatures && products && products.length > 0) {
                setSearchStep('Extracting visual features locally...');
                // Allow UI to update before heavy local processing
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Fallback to local heuristic search
                const localMatches = await matchCatalogProducts(userFeatures, products, 50);
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
                className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 my-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 bg-gray-50/90 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                                📷 AI Visual Search
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
                <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-white space-y-5">
                    {/* Error Banner */}
                    {errorMsg && mode !== 'INVALID_IMAGE' && (
                        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium flex items-center justify-between">
                            <span>⚠️ {errorMsg}</span>
                            <button onClick={() => setErrorMsg('')} className="text-rose-500 hover:text-rose-900 font-bold ml-2 cursor-pointer">✕</button>
                        </div>
                    )}

                    {/* MODE 1: CHOICE (Upload or Camera) */}
                    {mode === 'CHOICE' && (
                        <div className="space-y-4">
                            <div 
                                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                                onDragLeave={() => setIsDragOver(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                                    isDragOver 
                                        ? 'border-black bg-gray-50 scale-101' 
                                        : 'border-gray-300 hover:border-black hover:bg-gray-50/60'
                                }`}
                            >
                                <input 
                                    ref={fileInputRef} 
                                    type="file" 
                                    accept="image/jpeg,image/png,image/webp" 
                                    onChange={handleFileSelect} 
                                    className="hidden" 
                                />
                                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl text-gray-600">
                                    📁
                                </div>
                                <h3 className="text-sm font-bold text-gray-900">Upload Product Image</h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    Drag & drop your clothing photo here, or <span className="text-black font-bold underline">browse files</span>
                                </p>
                                <span className="inline-block mt-3 px-3 py-1 bg-gray-100 text-gray-600 text-[11px] font-semibold rounded-full">
                                    Supports JPG, PNG, WEBP (Max 10MB)
                                </span>
                            </div>

                            <div className="relative flex py-1 items-center">
                                <div className="flex-grow border-t border-gray-200"></div>
                                <span className="flex-shrink mx-4 text-xs font-bold text-gray-400 uppercase tracking-widest">OR</span>
                                <div className="flex-grow border-t border-gray-200"></div>
                            </div>

                            <button
                                onClick={startCamera}
                                className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3.5 px-4 rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                            >
                                <span>📷</span> Open Camera & Capture Photo
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
                        <div className="py-8 text-center space-y-8 relative">
                            {/* High-Tech Background Ambient Glows */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-sky-100/70 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>
                            
                            <div className="relative max-w-sm mx-auto group">
                                {/* Decorative Tech Border Elements */}
                                <div className="absolute -top-3 -left-3 w-8 h-8 border-t-2 border-l-2 border-indigo-500 rounded-tl-xl animate-pulse"></div>
                                <div className="absolute -top-3 -right-3 w-8 h-8 border-t-2 border-r-2 border-indigo-500 rounded-tr-xl animate-pulse"></div>
                                <div className="absolute -bottom-3 -left-3 w-8 h-8 border-b-2 border-l-2 border-indigo-500 rounded-bl-xl animate-pulse"></div>
                                <div className="absolute -bottom-3 -right-3 w-8 h-8 border-b-2 border-r-2 border-indigo-500 rounded-br-xl animate-pulse"></div>

                                <div className="relative max-h-80 w-full rounded-2xl overflow-hidden shadow-[0_20px_50px_-12px_rgba(99,102,241,0.3)] bg-gray-900 border border-gray-800">
                                    {/* Base Image */}
                                    <img 
                                        src={selectedImage} 
                                        alt="Scanning..." 
                                        className="w-full h-72 object-cover opacity-60 mix-blend-screen"
                                    />
                                    
                                    {/* Advanced Crosshair Scanner */}
                                    <div className="absolute top-0 left-0 right-0 h-full w-full pointer-events-none">
                                        {/* Horizontal Laser */}
                                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-cyan-400 shadow-[0_0_15px_3px_rgba(34,211,238,0.8)] animate-[scan-y_3s_ease-in-out_infinite]" />
                                        {/* Vertical Laser */}
                                        <div className="absolute top-0 bottom-0 left-0 w-[2px] bg-indigo-500 shadow-[0_0_15px_3px_rgba(99,102,241,0.8)] animate-[scan-x_4s_ease-in-out_infinite]" />
                                    </div>

                                    {/* Dynamic AI Bounding Boxes */}
                                    <div className="absolute inset-0 pointer-events-none">
                                        <div className="absolute top-[20%] left-[30%] w-24 h-24 border border-cyan-400/80 bg-cyan-400/10 rounded-sm animate-[focus-box_2s_infinite]">
                                            <div className="absolute -top-5 left-0 bg-cyan-400 text-black text-[8px] font-mono px-1 font-bold">TEXTURE: MATCH</div>
                                        </div>
                                        <div className="absolute bottom-[30%] right-[20%] w-16 h-20 border border-indigo-400/80 bg-indigo-400/10 rounded-sm animate-[focus-box_3s_infinite_1s]">
                                            <div className="absolute -top-5 left-0 bg-indigo-400 text-white text-[8px] font-mono px-1 font-bold">PATTERN: OK</div>
                                        </div>
                                    </div>
                                    
                                    {/* Live Data Feed Terminal (Mock) */}
                                    <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md rounded-lg p-2 border border-gray-700/50 text-left">
                                        <div className="font-mono text-[9px] text-cyan-400 leading-tight animate-[scroll-feed_3s_linear_infinite]">
                                            <div>&gt; Initializing neural net... OK</div>
                                            <div className="text-indigo-300">&gt; Extracting visual vectors... [||||||||] 100%</div>
                                            <div>&gt; Identifying fabric composition...</div>
                                            <div className="text-pink-300">&gt; Querying Veloura Database...</div>
                                            <div>&gt; Running similarity search...</div>
                                        </div>
                                    </div>
                                    
                                    {/* Overlay Grid pattern for tech feel */}
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.15] mix-blend-overlay"></div>
                                </div>
                            </div>
                            
                            <div className="space-y-4 relative z-10 pt-4">
                                <div className="flex items-center justify-center gap-4">
                                    {/* Percentage Counter */}
                                    <div className="w-14 h-14 rounded-full border-4 border-indigo-100 flex items-center justify-center border-t-indigo-600 animate-[spin_2s_linear_infinite]">
                                        <div className="w-full h-full rounded-full flex items-center justify-center bg-white animate-[spin_2s_linear_infinite_reverse]">
                                            <span className="text-xs font-black text-indigo-900 animate-pulse">99%</span>
                                        </div>
                                    </div>
                                    
                                    <div className="text-left">
                                        <h3 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 animate-gradient-x tracking-tight">
                                            Neural Processing...
                                        </h3>
                                        <p className="text-[11px] font-bold text-gray-500 font-mono tracking-[0.15em] mt-1 uppercase transition-all duration-300">
                                            {scanningText}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Inline style for the scan keyframes */}
                            <style>{`
                                @keyframes scan-y {
                                    0% { transform: translateY(0); opacity: 0; }
                                    10% { opacity: 1; }
                                    90% { opacity: 1; }
                                    100% { transform: translateY(280px); opacity: 0; }
                                }
                                @keyframes scan-x {
                                    0% { transform: translateX(0); opacity: 0; }
                                    10% { opacity: 1; }
                                    90% { opacity: 1; }
                                    100% { transform: translateX(380px); opacity: 0; }
                                }
                                @keyframes focus-box {
                                    0%, 100% { opacity: 0; transform: scale(0.9); }
                                    10%, 90% { opacity: 1; transform: scale(1); }
                                }
                                @keyframes scroll-feed {
                                    0% { transform: translateY(10px); opacity: 0.5; }
                                    50% { transform: translateY(-5px); opacity: 1; }
                                    100% { transform: translateY(-20px); opacity: 0; }
                                }
                                .animate-gradient-x {
                                    background-size: 200% 200%;
                                    animation: gradient-x 3s ease infinite;
                                }
                                @keyframes gradient-x {
                                    0%, 100% { background-position: 0% 50%; }
                                    50% { background-position: 100% 50%; }
                                }
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

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-96 overflow-y-auto p-1">
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
