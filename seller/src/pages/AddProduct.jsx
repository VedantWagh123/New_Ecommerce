import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Upload, ArrowLeft, Plus, Check } from 'lucide-react';

const AddProduct = ({ token }) => {
  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  const [image1, setImage1] = useState(false);
  const [image2, setImage2] = useState(false);
  const [image3, setImage3] = useState(false);
  const [image4, setImage4] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discount, setDiscount] = useState('0');
  const [category, setCategory] = useState(['Women']);
  const [subCategory, setSubCategory] = useState('Topwear');

  const ALL_CATEGORIES = ['Men', 'Women', 'Kids', 'Footwear', 'Accessories', 'Jewellery', 'Winterwear', 'Sportswear', 'Ethnic Wear', 'Fashion Essentials'];
  const [material, setMaterial] = useState('');
  const [colors, setColors] = useState('');
  const [bestseller, setBestseller] = useState(false);

  const [sizes, setSizes] = useState(['S', 'M', 'L']);
  const CITIES = [
    { id: 'WH_NAGPUR', name: 'Nagpur' },
    { id: 'WH_WARDHA', name: 'Wardha' },
    { id: 'WH_DHAMANGAON', name: 'Dhamangaon Rly' }
  ];
  const [cityStockMap, setCityStockMap] = useState({
      WH_NAGPUR: { S: 10, M: 10, L: 10 },
      WH_WARDHA: { S: 0, M: 0, L: 0 },
      WH_DHAMANGAON: { S: 0, M: 0, L: 0 }
  });
  const [customSizeInput, setCustomSizeInput] = useState('');

  const [loading, setLoading] = useState(false);

  const getCategorySizes = (cats, subCat) => {
    let allSizes = new Set();
    if (!cats || cats.length === 0) return ['S', 'M', 'L', 'XL', 'XXL'];
    cats.forEach(cat => {
      if (['Jewellery', 'Accessories', 'Fashion Essentials'].includes(cat) || ['Jewellery', 'Accessories', 'Fashion Essentials'].includes(subCat)) {
        ['Free Size', 'One Size', 'Adjustable', 'Ring 6', 'Ring 7', 'Ring 8', 'Ring 9', 'Ring 10'].forEach(s => allSizes.add(s));
      } else if (cat === 'Footwear' || subCat === 'Footwear') {
        ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'].forEach(s => allSizes.add(s));
      } else {
        ['S', 'M', 'L', 'XL', 'XXL'].forEach(s => allSizes.add(s));
      }
    });
    return Array.from(allSizes);
  };

  const updateSizesBasedOnCat = (cats, subCat) => {
    const validSizes = getCategorySizes(cats, subCat);
    if (validSizes.includes('Free Size') && !validSizes.includes('S')) {
      setSizes(['Free Size']);
      setCityStockMap({
          WH_NAGPUR: { 'Free Size': 10 }, WH_WARDHA: { 'Free Size': 0 }, WH_DHAMANGAON: { 'Free Size': 0 }
      });
    } else if (validSizes.includes('UK 7') && !validSizes.includes('S')) {
      setSizes(['UK 7', 'UK 8', 'UK 9']);
      setCityStockMap({
          WH_NAGPUR: { 'UK 7': 10, 'UK 8': 10, 'UK 9': 10 }, WH_WARDHA: { 'UK 7': 0, 'UK 8': 0, 'UK 9': 0 }, WH_DHAMANGAON: { 'UK 7': 0, 'UK 8': 0, 'UK 9': 0 }
      });
    } else {
      setSizes(['S', 'M', 'L']);
      setCityStockMap({
          WH_NAGPUR: { S: 10, M: 10, L: 10 }, WH_WARDHA: { S: 0, M: 0, L: 0 }, WH_DHAMANGAON: { S: 0, M: 0, L: 0 }
      });
    }
  };

  const toggleCategory = (cat) => {
    setCategory(prev => {
      const newCats = prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat];
      updateSizesBasedOnCat(newCats, subCategory);
      return newCats;
    });
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
      setCityStockMap(prev => {
          const newMap = { ...prev };
          CITIES.forEach(c => {
              if (newMap[c.id][size] === undefined) newMap[c.id][size] = c.id === 'WH_NAGPUR' ? 10 : 0;
          });
          return newMap;
      });
    }
  };

  const handleAddCustomSize = () => {
    if (!customSizeInput.trim()) return;
    const val = customSizeInput.trim();
    if (!sizes.includes(val)) {
      setSizes([...sizes, val]);
      setCityStockMap(prev => {
          const newMap = { ...prev };
          CITIES.forEach(c => {
              if (newMap[c.id][val] === undefined) newMap[c.id][val] = c.id === 'WH_NAGPUR' ? 10 : 0;
          });
          return newMap;
      });
    }
    setCustomSizeInput('');
  };

  const handleStockChange = (city, size, val) => {
    setCityStockMap(prev => ({
        ...prev,
        [city]: {
            ...prev[city],
            [size]: Number(val)
        }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image1) {
      toast.error("Please upload at least the primary product image (Image 1)");
      return;
    }
    if (sizes.length === 0) {
      toast.error("Please select at least one available size");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('discount', discount);
      formData.append('category', JSON.stringify(category));
      formData.append('subCategory', subCategory);
      formData.append('material', material);
      formData.append('bestseller', bestseller);
      formData.append('sizes', JSON.stringify(sizes));

      const colorsArr = colors ? colors.split(',').map(c => c.trim()).filter(Boolean) : [];
      formData.append('colors', JSON.stringify(colorsArr));

      // Filter stock map for selected sizes and build warehouseInventory array
      const legacyStock = {};
      const newWarehouseInventory = [];
      Object.entries(cityStockMap).forEach(([city, sizeMap]) => {
          let cityTotal = 0;
          const filteredSizeMap = {};
          Object.entries(sizeMap).forEach(([sz, qty]) => {
              if (sizes.includes(sz)) {
                  legacyStock[sz] = (legacyStock[sz] || 0) + qty;
                  cityTotal += qty;
                  filteredSizeMap[sz] = qty;
              }
          });
          newWarehouseInventory.push({
              warehouseId: city,
              stock: cityTotal,
              stockMap: filteredSizeMap,
              reserved: 0
          });
      });

      formData.append('stock', JSON.stringify(legacyStock));
      formData.append('warehouseInventory', JSON.stringify(newWarehouseInventory));

      if (image1) formData.append('image1', image1);
      if (image2) formData.append('image2', image2);
      if (image3) formData.append('image3', image3);
      if (image4) formData.append('image4', image4);

      const response = await axios.post(`${backendUrl}/api/seller/products/add`, formData, {
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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Add New Fashion Product</h1>
          <p className="text-xs text-slate-500 font-medium">Submit new apparel item for admin approval & store listing.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs space-y-8">
        {/* Upload Images */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            Upload Product Images (Max 4)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { state: image1, setter: setImage1, id: 'img1' },
              { state: image2, setter: setImage2, id: 'img2' },
              { state: image3, setter: setImage3, id: 'img3' },
              { state: image4, setter: setImage4, id: 'img4' },
            ].map((img, idx) => (
              <label
                key={img.id}
                htmlFor={img.id}
                className="h-36 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-slate-800 hover:bg-slate-50/50 transition-all relative overflow-hidden"
              >
                {img.state ? (
                  <img src={URL.createObjectURL(img.state)} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <div className="text-center p-3">
                    <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                    <span className="text-[11px] font-bold text-slate-600 block">Image {idx + 1}</span>
                    <span className="text-[9px] text-slate-400">{idx === 0 ? 'Primary' : 'Optional'}</span>
                  </div>
                )}
                <input
                  type="file"
                  id={img.id}
                  hidden
                  onChange={(e) => img.setter(e.target.files[0])}
                  accept="image/*"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Basic Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Product Title</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Women Round Neck Cotton T-Shirt"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows="3"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe fabric softness, fit style, pattern, care instructions..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white"
            ></textarea>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-2">Category (Select multiple)</label>
            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORIES.map(cat => {
                const selected = category.includes(cat);
                return (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-1 cursor-pointer ${
                      selected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {selected && <Check className="w-3 h-3" />}
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Sub Category</label>
            <select
              value={subCategory}
              onChange={(e) => handleSubCategoryChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
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
              min="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="65"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Discount (%)</label>
            <input
              type="number"
              min="0"
              max="90"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="10"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Material / Fabric</label>
            <input
              type="text"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="100% Organic Cotton"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Colors (comma separated)</label>
            <input
              type="text"
              value={colors}
              onChange={(e) => setColors(e.target.value)}
              placeholder="Black, Navy Blue, Crimson"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
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
              {(category.some(c => ['Jewellery', 'Accessories', 'Fashion Essentials'].includes(c))) || ['Jewellery', 'Accessories', 'Fashion Essentials'].includes(subCategory)
                ? '✨ Defaulted to Free Size / Adjustable' 
                : (category.includes('Footwear') || subCategory === 'Footwear') ? '👟 Shoe Size Matrix' : '👕 Apparel Sizes'}
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

        {/* Distributed Inventory by City & Size */}
        {sizes.length > 0 && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-900">Distributed Inventory (3-City)</h4>
            
            <div className="space-y-4">
              {CITIES.map(city => (
                <div key={city.id} className="bg-white p-3 rounded-xl border border-slate-200">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    {city.name} Warehouse
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                    {sizes.map(size => (
                      <div key={size}>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">Size {size}</label>
                        <input
                          type="number"
                          min="0"
                          value={cityStockMap[city.id]?.[size] !== undefined ? cityStockMap[city.id][size] : 0}
                          onChange={(e) => handleStockChange(city.id, size, e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-1 focus:ring-slate-900"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bestseller Checkbox */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="bestseller"
            checked={bestseller}
            onChange={(e) => setBestseller(e.target.checked)}
            className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 border-slate-300"
          />
          <label htmlFor="bestseller" className="text-xs font-bold text-slate-700 cursor-pointer">
            Mark as Featured / Bestseller Product
          </label>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="py-3 px-8 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Submitting to Admin...' : 'Submit Product for Admin Approval'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
