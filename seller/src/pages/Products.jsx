import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  PackagePlus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Edit3, 
  Trash2, 
  Tag, 
  Boxes 
} from 'lucide-react';
import { SocketContext } from '../context/SocketContext';

const currency = '₹';

const Products = ({ token, searchQuery }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [deletingId, setDeletingId] = useState(null);

  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${backendUrl}/api/seller/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setProducts(response.data.products);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProducts();
    }
  }, [token]);

  const { socket } = useContext(SocketContext);

  useEffect(() => {
    if (socket) {
      const handleUpdate = () => fetchProducts();
      socket.on('product-updated', handleUpdate);
      return () => {
        socket.off('product-updated', handleUpdate);
      }
    }
  }, [socket]);

  const handleDelete = async (id) => {
    try {
      const response = await axios.post(`${backendUrl}/api/seller/products/delete`, { id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        toast.success(response.data.message);
        setProducts(products.filter(p => p._id !== id));
        setDeletingId(null);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || product.approvalStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Live</span>;
      case 'pending':
        return <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 animate-pulse"><Clock className="w-3 h-3" /> Pending Approval</span>;
      case 'rejected':
      default:
        return <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</span>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Product Catalog</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Manage your fashion catalog, submit new designs, and view approval statuses.
          </p>
        </div>

        <button
          onClick={() => navigate('/add-product')}
          className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md self-start sm:self-auto cursor-pointer"
        >
          <PackagePlus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {['all', 'approved', 'pending', 'rejected'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
              statusFilter === status
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Product List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 font-medium">
          Loading catalog items...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <Boxes className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No products found</h3>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or click "Add New Product" to expand your catalog.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => {
            const totalStock = product.stock ? Object.values(product.stock).reduce((a, b) => a + Number(b), 0) : 0;
            return (
              <div key={product._id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    <img
                      src={product.image?.[0] || 'https://via.placeholder.com/300'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3">
                      {getStatusBadge(product.approvalStatus)}
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{product.category} &bull; {product.subCategory}</span>
                      <span className="text-xs font-bold text-slate-900">{currency}{product.price}</span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1 mb-2">{product.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">{product.description}</p>

                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                      <div className="flex items-center gap-1">
                        <Boxes className="w-3.5 h-3.5 text-slate-400" />
                        <span>Stock: <strong className="text-slate-800">{totalStock}</strong> units</span>
                      </div>
                      {product.sizes?.length > 0 && (
                        <div className="ml-auto flex gap-1">
                          {product.sizes.map(s => (
                            <span key={s} className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-700">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    {product.rejectionReason && (
                      <div className="mt-3 p-2 bg-rose-50 border border-rose-100 rounded-lg text-[11px] text-rose-700">
                        <strong>Rejection note:</strong> {product.rejectionReason}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => navigate(`/edit-product/${product._id}`, { state: { product } })}
                    className="py-1.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => setDeletingId(deletingId === product._id ? null : product._id)}
                    className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-bold text-rose-600 flex items-center gap-1.5 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>

                {/* Confirm Delete Prompt */}
                {deletingId === product._id && (
                  <div className="p-4 bg-rose-50 border-t border-rose-200 text-xs flex flex-col gap-2">
                    <span className="font-bold text-rose-800">Are you sure you want to delete this product?</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="py-1 px-3 bg-rose-600 text-white rounded font-bold"
                      >
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="py-1 px-3 bg-slate-200 text-slate-700 rounded font-bold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Products;
