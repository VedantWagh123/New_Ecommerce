import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Boxes, AlertTriangle, CheckCircle2, XCircle, Save, RefreshCw } from 'lucide-react';

const currency = '₹';

const Inventory = ({ token, searchQuery }) => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editCityStockMap, setEditCityStockMap] = useState({});
  const [savingId, setSavingId] = useState(null);

  const CITIES = [
    { id: 'WH_NAGPUR', name: 'Nagpur' },
    { id: 'WH_WARDHA', name: 'Wardha' },
    { id: 'WH_DHAMANGAON', name: 'Dhamangaon Rly' }
  ];

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${backendUrl}/api/seller/inventory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setInventory(response.data.inventory);
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
      fetchInventory();
    }
  }, [token]);

  const handleStartEdit = (item) => {
    setEditingId(item._id);
    
    const initialMap = {
        WH_NAGPUR: {},
        WH_WARDHA: {},
        WH_DHAMANGAON: {}
    };

    if (item.warehouseInventory && item.warehouseInventory.length > 0) {
        item.warehouseInventory.forEach(wh => {
            if (initialMap[wh.warehouseId] !== undefined) {
                initialMap[wh.warehouseId] = { ...(wh.stockMap || {}) };
            }
        });
        
        // Ensure all available sizes have a key, even if 0
        item.sizes?.forEach(size => {
            CITIES.forEach(c => {
                if (initialMap[c.id][size] === undefined) {
                    initialMap[c.id][size] = 0;
                }
            });
        });
    } else {
        item.sizes?.forEach(size => {
            initialMap.WH_NAGPUR[size] = item.stock?.[size] || 0;
            initialMap.WH_WARDHA[size] = 0;
            initialMap.WH_DHAMANGAON[size] = 0;
        });
    }

    setEditCityStockMap(initialMap);
  };

  const handleStockValueChange = (city, size, qty) => {
    setEditCityStockMap(prev => ({
        ...prev,
        [city]: {
            ...prev[city],
            [size]: Number(qty)
        }
    }));
  };

  const handleSaveStock = async (productId) => {
    try {
      setSavingId(productId);

      const legacyStock = {};
      const newWarehouseInventory = [];
      
      Object.entries(editCityStockMap).forEach(([city, sizeMap]) => {
          let cityTotal = 0;
          Object.entries(sizeMap).forEach(([size, qty]) => {
              legacyStock[size] = (legacyStock[size] || 0) + qty;
              cityTotal += qty;
          });
          
          newWarehouseInventory.push({
              warehouseId: city,
              stock: cityTotal,
              stockMap: sizeMap,
              reserved: 0
          });
      });

      const response = await axios.post(`${backendUrl}/api/seller/inventory/update`, {
        productId,
        stock: legacyStock,
        warehouseInventory: JSON.stringify(newWarehouseInventory)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setEditingId(null);
        fetchInventory();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingId(null);
    }
  };

  const filteredInventory = inventory.filter(item => {
    if (!searchQuery) return true;
    return item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           item.category.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Variant Inventory Management</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Monitor size-wise stock levels, receive low-stock alerts, and quickly adjust inventory.
          </p>
        </div>

        <button
          onClick={fetchInventory}
          className="py-2 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Stock</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 font-medium">
          Loading inventory breakdown...
        </div>
      ) : filteredInventory.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <Boxes className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No inventory entries</h3>
          <p className="text-xs text-slate-400 mt-1">Add products to your catalog to track size-wise inventory.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Product Item</th>
                  <th className="py-3.5 px-6">Price</th>
                  <th className="py-3.5 px-6">Variant Stock Breakdown</th>
                  <th className="py-3.5 px-6">Total Units</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredInventory.map(item => {
                  const isEditing = editingId === item._id;
                  return (
                    <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image || 'https://via.placeholder.com/60'}
                            alt={item.name}
                            className="w-12 h-14 object-cover rounded-lg border border-slate-200 flex-shrink-0"
                          />
                          <div>
                            <span className="font-bold text-slate-900 line-clamp-1">{item.name}</span>
                            <span className="text-[11px] text-slate-400 font-medium block">{item.category}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 font-bold text-slate-900">
                        {currency}{item.price}
                      </td>

                      <td className="py-4 px-6 min-w-[300px]">
                        {isEditing ? (
                          <div className="space-y-4">
                            {CITIES.map(city => (
                                <div key={city.id} className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">{city.name}</div>
                                    <div className="flex flex-wrap gap-2">
                                        {item.sizes?.map(size => (
                                            <div key={size} className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-slate-200 shadow-xs">
                                                <span className="font-bold text-[10px] text-slate-600">{size}:</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={editCityStockMap[city.id]?.[size] || 0}
                                                    onChange={(e) => handleStockValueChange(city.id, size, e.target.value)}
                                                    className="w-12 px-1 py-0.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-900 focus:ring-1 focus:ring-slate-900"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {item.warehouseInventory && item.warehouseInventory.length > 0 ? (
                                item.warehouseInventory.map(wh => {
                                    const cityName = CITIES.find(c => c.id === wh.warehouseId)?.name || wh.warehouseId;
                                    return (
                                        <div key={wh.warehouseId} className="flex items-start gap-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase w-16 shrink-0">{cityName}:</span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {Object.entries(wh.stockMap || {}).map(([sz, count]) => {
                                                    if (count === 0) return null;
                                                    return (
                                                        <span key={sz} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                            {sz}: {count}
                                                        </span>
                                                    );
                                                })}
                                                {wh.stock === 0 && <span className="text-[10px] text-rose-500 font-medium">Empty</span>}
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="flex flex-wrap gap-1.5">
                                    {Object.entries(item.stock || {}).map(([sz, count]) => (
                                    <span
                                        key={sz}
                                        className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                                        Number(count) === 0
                                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                                            : Number(count) <= 5
                                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                                            : 'bg-slate-100 text-slate-700 border-slate-200'
                                        }`}
                                    >
                                        {sz}: {count}
                                    </span>
                                    ))}
                                </div>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-6 font-bold text-slate-900 text-sm">
                        {item.totalStock}
                      </td>

                      <td className="py-4 px-6">
                        {item.status === 'Out of Stock' ? (
                          <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
                            <XCircle className="w-3 h-3" /> Out of Stock
                          </span>
                        ) : item.status === 'Low Stock' ? (
                          <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" /> In Stock
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleSaveStock(item._id)}
                              disabled={savingId === item._id}
                              className="py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 transition-all"
                            >
                              <Save className="w-3.5 h-3.5" /> Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="py-1 px-2.5 bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs transition-all cursor-pointer"
                          >
                            Edit Stock
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
