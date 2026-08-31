import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';

const AddVideo = ({ token }) => {
    const [video, setVideo] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [products, setProducts] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [loading, setLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');

    useEffect(() => {
        // Fetch products to map video to a product
        const fetchProducts = async () => {
            try {
                // Fetch only the seller's approved products
                const res = await axios.get(`${backendUrl}/api/seller/products`, { headers: { Authorization: `Bearer ${token}` } });
                if (res.data.success) {
                    setProducts(res.data.products);
                    if (res.data.products.length > 0) {
                        setSelectedProductId(res.data.products[0]._id);
                    }
                }
            } catch (error) {
                console.error("Fetch Products Error:", error);
                toast.error("Failed to load products");
            }
        };
        fetchProducts();
    }, [token]);

    const handleVideoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 50 * 1024 * 1024) {
                toast.error("Video file is too large. Maximum size is 50MB.");
                return;
            }

            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = function() {
                window.URL.revokeObjectURL(video.src);
                if (video.duration > 40) {
                    toast.error("Video is too long! Maximum allowed duration is 40 seconds.");
                    e.target.value = '';
                    setVideo(null);
                    setPreviewUrl('');
                } else {
                    setVideo(file);
                    setPreviewUrl(URL.createObjectURL(file));
                }
            };
            video.src = URL.createObjectURL(file);
        }
    };

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        if (!video) {
            toast.error("Please select a video file");
            return;
        }
        if (!selectedProductId) {
            toast.error("Please select an associated product");
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("description", description);
            formData.append("productId", selectedProductId);
            formData.append("video", video);

            const response = await axios.post(`${backendUrl}/api/discover/upload`, formData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                toast.success(response.data.message);
                setTitle('');
                setDescription('');
                setVideo(null);
                setPreviewUrl('');
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

    return (
        <form onSubmit={onSubmitHandler} className='flex flex-col w-full items-start gap-4'>
            <div className='w-full'>
                <h3 className='text-lg font-bold mb-4'>Upload Studio Video</h3>
                
                <p className='mb-2 text-sm text-gray-700'>Select Product to Feature</p>
                <select 
                    value={selectedProductId} 
                    onChange={(e) => setSelectedProductId(e.target.value)} 
                    className='w-full max-w-[500px] px-3 py-2 border rounded-md mb-4'
                    required
                >
                    <option value="" disabled>Select a product...</option>
                    {products.map(p => (
                        <option key={p._id} value={p._id}>{p.name} - ₹{p.price}</option>
                    ))}
                </select>

                <p className='mb-2 text-sm text-gray-700'>Video File (Max 50MB, MP4/WebM)</p>
                <input 
                    type="file" 
                    accept="video/mp4,video/webm,video/quicktime" 
                    onChange={handleVideoChange}
                    className='mb-4'
                    required
                />
                
                {previewUrl && (
                    <div className='mb-4'>
                        <video src={previewUrl} controls className='h-64 rounded-md border border-gray-200'></video>
                    </div>
                )}

                <p className='mb-2 text-sm text-gray-700'>Video Title</p>
                <input 
                    onChange={(e) => setTitle(e.target.value)} 
                    value={title} 
                    className='w-full max-w-[500px] px-3 py-2 border rounded-md mb-4' 
                    type="text" 
                    placeholder='e.g., Styling the Summer Collection' 
                    required
                />

                <p className='mb-2 text-sm text-gray-700'>Short Description / Caption</p>
                <textarea 
                    onChange={(e) => setDescription(e.target.value)} 
                    value={description} 
                    className='w-full max-w-[500px] px-3 py-2 border rounded-md mb-4' 
                    placeholder='Write a catchy caption...' 
                    rows={3}
                />

                <button 
                    type="submit" 
                    disabled={loading}
                    className={`w-32 py-3 mt-4 bg-black text-white font-bold rounded-md ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800'}`}
                >
                    {loading ? 'Uploading...' : 'PUBLISH'}
                </button>
                {loading && <p className='text-xs text-gray-500 mt-2'>This may take a minute while we optimize the video...</p>}
            </div>
        </form>
    );
};

export default AddVideo;
