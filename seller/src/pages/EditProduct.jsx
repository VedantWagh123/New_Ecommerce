import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ArrowLeft, Check } from 'lucide-react';

const EditProduct = ({ token }) => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  const initialProduct = location.state?.product;

  const [name, setName] = useState(initialProduct?.name || '');
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [price, setPrice] = useState(initialProduct?.price || '');
  const [discount, setDiscount] = useState(initialProduct?.discount || '0');
  const [category, setCategory] = useState(initialProduct?.category || 'Women');
  const [subCategory, setSubCategory] = useState(initialProduct?.subCategory || 'Topwear');
  const [material, setMaterial] = useState(initialProduct?.material || '');
  const [colors, setColors] = useState(initialProduct?.colors?.join(', ') || '');
  const [bestseller, setBestseller] = useState(initialProduct?.bestseller || false);
  const [sizes, setSizes] = useState(initialProduct?.sizes || ['S', 'M', 'L']);
  const [stockMap, setStockMap] = useState(initialProduct?.stock || { S: 10, M: 10, L: 10 });
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [loading, setLoading] = useState(false);

  const getCategorySizes = (cat, subCat) => {
    if (['Jewellery', 'Accessories', 'Fashion Essentials'].includes(cat) || ['Jewellery', 'Accessories', 'Fashion Essentials'].includes(subCat)) {
      return ['Free Size', 'One Size', 'Adjustable', 'Ring 6', 'Ring 7', 'Ring 8', 'Ring 9', 'Ring 10'];
    }
    if (cat === 'Footwear' || subCat === 'Footwear') {
      return ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'];
    }
    return ['S', 'M', 'L', 'XL', 'XXL'];
  };

  const updateSizesBasedOnCat = (cat, subCat) => {
    if (['Jewellery', 'Accessories', 'Fashion Essentials'].includes(cat) || ['Jewellery', 'Accessories', 'Fashion Essentials'].includes(subCat)) {
      setSizes(['Free Size']);
      setStockMap({ 'Free Size': 10 });
    } else if (cat === 'Footwear' || subCat === 'Footwear') {
      setSizes(['UK 7', 'UK 8', 'UK 9']);
      setStockMap({ 'UK 7': 10, 'UK 8': 10, 'UK 9': 10 });
    } else {
      setSizes(['S', 'M', 'L']);
      setStockMap({ S: 10, M: 10, L: 10 });
    }
  };

  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    updateSizesBasedOnCat(newCat, subCategory);
  };

  const handleSubCategoryChange = (newSubCat) => {
    setSubCategory(newSubCat);
    updateSizesBasedOnCat(category, newSubCat);
  };

  const handleSizeToggle = (size) => {
    if (sizes.includes(size)) {
      setSizes(sizes.filter(s => s !== size));
    } else {
      setSizes([...sizes, size]);
      if (stockMap[size] === undefined) {
        setStockMap(prev => ({ ...prev, [size]: 10 }));
      }
    }
  };

  const handleAddCustomSize = () => {
    if (!customSizeInput.trim()) return;
    const val = customSizeInput.trim();
    if (!sizes.includes(val)) {
      setSizes([...sizes, val]);
      setStockMap(prev => ({ ...prev, [val]: 10 }));
    }
    setCustomSizeInput('');
  };

  const handleStockChange = (size, val) => {
    setStockMap(prev => ({ ...prev, [size]: Number(val) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const colorsArr = colors ? colors.split(',').map(c => c.trim()).filter(Boolean) : [];
      const finalStock = {};
      sizes.forEach(s => {
        finalStock[s] = stockMap[s] !== undefined ? Number(stockMap[s]) : 10;
      });

      const response = await axios.post(`${backendUrl}/api/seller/products/edit`, {
        id,
        name,
        description,
        price,
        discount,
        category,
        subCategory,
        material,
        bestseller,
        sizes,
        colors: colorsArr,
        stock: finalStock
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success(response.data.message);
        navigate('/products');
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

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/products')}
          className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-700" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Edit Product</h1>
          <p className="text-xs text-slate-500 font-medium">Update pricing, description, variant stock, or specs.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Product Title</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows="3"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
            >
              <option value="Men">Men</option>
              <option value="Women">Women</option>
              <option value="Kids">Kids</option>
              <option value="Footwear">Footwear</option>
              <option value="Accessories">Accessories</option>
              <option value="Jewellery">Jewellery</option>
              <option value="Winterwear">Winterwear</option>
              <option value="Sportswear">Sportswear</option>
              <option value="Ethnic Wear">Ethnic Wear</option>
              <option value="Fashion Essentials">Fashion Essentials</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Sub Category</label>
            <select
              value={subCategory}
              onChange={(e) => handleSubCategoryChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
            >
              <option value="Topwear">Topwear</option>
              <option value="Bottomwear">Bottomwear</option>
              <option value="Winterwear">Winterwear</option>
              <option value="Footwear">Footwear</option>
              <option value="Accessories">Accessories</option>
              <option value="Jewellery">Jewellery</option>
              <option value="Sportswear">Sportswear</option>
              <option value="Ethnic Wear">Ethnic Wear</option>
              <option value="Fashion Essentials">Fashion Essentials</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Price ($)</label>
            <input
              type="number"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Discount (%)</label>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
            />
          </div>
        </div>

        {/* Dynamic Category Sizes Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Available Sizes / Options
            </label>
            <span className="text-[11px] text-indigo-600 font-semibold">
              {['Jewellery', 'Accessories', 'Fashion Essentials'].includes(category) || ['Jewellery', 'Accessories', 'Fashion Essentials'].includes(subCategory)
                ? '✨ Defaulted to Free Size / Adjustable' 
                : (category === 'Footwear' || subCategory === 'Footwear') ? '👟 Shoe Size Matrix' : '👕 Apparel Sizes'}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {getCategorySizes(category, subCategory).map(size => {
              const selected = sizes.includes(size);
              return (
                <button
                  type="button"
                  key={size}
                  onClick={() => handleSizeToggle(size)}
                  className={`px-3.5 h-10 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1 cursor-pointer ${
                    selected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {selected && <Check className="w-3 h-3" />}
                  <span>{size}</span>
                </button>
              );
            })}
          </div>

          {/* Custom Size Addition */}
          <div className="mt-3 flex items-center gap-2 max-w-sm">
            <input
              type="text"
              value={customSizeInput}
              onChange={(e) => setCustomSizeInput(e.target.value)}
              placeholder="Or type custom size (e.g. 2.4 Bangle, 18 inch)"
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 flex-1 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
            <button
              type="button"
              onClick={handleAddCustomSize}
              className="px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 cursor-pointer shadow-2xs"
            >
              + Add Size
            </button>
          </div>
        </div>

        {/* Variant-wise Stock */}
        {sizes.length > 0 && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-900">Stock Count Per Size Variant</h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {sizes.map(size => (
                <div key={size}>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Size {size} Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={stockMap[size] !== undefined ? stockMap[size] : 10}
                    onChange={(e) => handleStockChange(size, e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="py-3 px-8 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Save & Resubmit for Review'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProduct;
