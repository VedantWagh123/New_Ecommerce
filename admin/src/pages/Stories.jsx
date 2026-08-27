import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';
import { PlusCircle, Trash2, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';

const Stories = ({ token }) => {
    const [stories, setStories] = useState([]);
    const [title, setTitle] = useState('');
    const [link, setLink] = useState('');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchStories = async () => {
        try {
            const response = await axios.get(backendUrl + '/api/story/list');
            if (response.data.success) {
                setStories(response.data.stories);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
    };

    useEffect(() => {
        fetchStories();
    }, []);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        if (!title || !image) {
            return toast.error("Title and Image are required");
        }
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('link', link);
            formData.append('image', image);

            const response = await axios.post(backendUrl + '/api/story/add', formData, {
                headers: { token }
            });

            if (response.data.success) {
                toast.success(response.data.message);
                setTitle('');
                setLink('');
                setImage(null);
                setImagePreview(null);
                fetchStories();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
        setLoading(false);
    };

    const removeStory = async (id) => {
        try {
            const response = await axios.post(backendUrl + '/api/story/remove', { id }, { headers: { token } });
            if (response.data.success) {
                toast.success(response.data.message);
                fetchStories();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
    };

    return (
        <div className="p-8 w-full animate-fade-in text-gray-800">
            <h1 className="text-3xl font-black text-gray-900 mb-8 uppercase tracking-wider flex items-center gap-3">
                <span className="text-pink-500">📸</span> Story Highlights
            </h1>

            <div className="flex flex-col xl:flex-row gap-8">
                {/* Add Story Form */}
                <div className="w-full xl:w-[400px] shrink-0">
                    <form onSubmit={onSubmitHandler} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-5">
                        <h2 className="text-lg font-bold flex items-center gap-2 mb-2">
                            <PlusCircle className="w-5 h-5 text-indigo-600" /> Create New Story
                        </h2>

                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Story Image</p>
                            <label htmlFor="image" className="cursor-pointer flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 transition-colors overflow-hidden">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center text-gray-400">
                                        <ImageIcon className="w-8 h-8 mb-2" />
                                        <span className="text-sm font-medium">Click to upload</span>
                                    </div>
                                )}
                                <input onChange={handleImageChange} type="file" id="image" hidden accept="image/*" />
                            </label>
                        </div>

                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Short Title</p>
                            <input 
                                onChange={(e) => setTitle(e.target.value)} 
                                value={title} 
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors text-sm font-medium" 
                                type="text" 
                                placeholder="e.g., Summer Sale" 
                                required 
                            />
                        </div>

                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Product ID or Redirect Link</p>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                <input 
                                    onChange={(e) => setLink(e.target.value)} 
                                    value={link} 
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors text-sm font-medium" 
                                    type="text" 
                                    placeholder="e.g., 66b328a9b3a... (Product ID)" 
                                />
                            </div>
                            <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                                💡 <b>How to link a specific product:</b> Open your website, go to the product page, and copy the ID from the URL (e.g., if URL is <code>/product/66b3...</code>, paste <code>66b3...</code> here). If left blank, it redirects to the Collection page.
                            </p>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="mt-2 w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center"
                        >
                            {loading ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : "PUBLISH STORY"}
                        </button>
                    </form>
                </div>

                {/* Stories List */}
                <div className="flex-1">
                    <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
                        Active Stories <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{stories.length}</span>
                    </h2>
                    
                    {stories.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                            <p className="text-gray-500 font-medium">No active stories found. Create one to show on homepage.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {stories.map((item) => (
                                <div key={item._id} className="relative group rounded-2xl overflow-hidden aspect-[9/16] bg-gray-100 shadow-sm border border-gray-200">
                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                                        <h3 className="text-white font-bold text-lg mb-1">{item.title}</h3>
                                        <p className="text-white/70 text-xs truncate">{item.link}</p>
                                    </div>
                                    <button 
                                        onClick={() => removeStory(item._id)}
                                        className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Stories;
