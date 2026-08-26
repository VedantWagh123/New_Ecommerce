import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';

const ManageVideos = ({ token }) => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchVideos = async () => {
        try {
            const response = await axios.get(`${backendUrl}/api/discover/my-videos`, { headers: { Authorization: `Bearer ${token}` } });
            if (response.data.success) {
                setVideos(response.data.videos);
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

    const removeVideo = async (id) => {
        if (!window.confirm("Are you sure you want to permanently delete this video? It will be removed from Cloudinary and the database.")) return;
        
        try {
            const response = await axios.post(`${backendUrl}/api/discover/delete`, { id }, { headers: { Authorization: `Bearer ${token}` } });
            if (response.data.success) {
                toast.success(response.data.message);
                await fetchVideos();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.message);
        }
    };

    useEffect(() => {
        fetchVideos();
    }, [token]);

    if (loading) return <div>Loading videos...</div>;

    return (
        <>
            <p className='mb-2 text-lg font-bold'>Manage Studio Videos</p>
            <div className='flex flex-col gap-2'>
                {/* List Table Title */}
                <div className='hidden md:grid grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center py-2 px-4 border bg-gray-100 text-sm font-bold'>
                    <b>Thumbnail</b>
                    <b>Video Details</b>
                    <b>Product</b>
                    <b>Metrics</b>
                    <b className='text-center'>Action</b>
                </div>

                {/* Video List */}
                {videos.map((item, index) => (
                    <div className='grid grid-cols-[1fr_3fr_1fr] md:grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center gap-2 py-3 px-4 border bg-white rounded shadow-sm text-sm' key={index}>
                        <img className='w-16 h-24 object-cover rounded' src={item.thumbnailUrl} alt="thumbnail" />
                        <div>
                            <p className='font-bold text-gray-800'>{item.title}</p>
                            <p className='text-xs text-gray-500 mt-1 line-clamp-2'>{item.description}</p>
                            <p className='text-[10px] text-gray-400 mt-1'>Added: {new Date(item.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className='text-xs font-semibold'>
                            {item.productId ? item.productId.name : <span className="text-red-500">Product Deleted</span>}
                        </div>
                        <div className='text-xs text-gray-600 hidden md:block space-y-1'>
                            <p>👁️ {item.metrics.views} Views</p>
                            <p>❤️ {item.metrics.likes} Likes</p>
                        </div>
                        <div className='flex justify-center'>
                            <button 
                                onClick={() => removeVideo(item._id)} 
                                className='text-red-500 hover:text-red-700 font-bold p-2 bg-red-50 hover:bg-red-100 rounded transition-colors text-xs'
                            >
                                DELETE
                            </button>
                        </div>
                    </div>
                ))}
                
                {videos.length === 0 && (
                    <div className='p-8 text-center text-gray-500 border rounded'>
                        No videos uploaded yet. Go to 'Add Video' to start.
                    </div>
                )}
            </div>
        </>
    );
};

export default ManageVideos;
