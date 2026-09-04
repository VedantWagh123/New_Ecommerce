import React, { useEffect, useState, useContext, useRef } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';
import { SocketContext } from '../context/SocketContext';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet marker icon issue in React safely
try {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
  });
} catch (error) {
  console.warn("Leaflet Icon Override Warning:", error);
}

const LiveMap = ({ token }) => {
  const [locations, setLocations] = useState([]);
  const [hubFilter, setHubFilter] = useState('ALL');
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  
  const context = useContext(SocketContext);
  const socket = context ? context.socket : null;

  const centerCoords = {
    NAGPUR: [21.1458, 79.0882],
    WARDHA: [20.7453, 78.6022],
    DHAMANGAON: [20.7674, 78.1408],
    ALL: [20.9458, 78.8452]
  };

  const fetchLiveLocations = async () => {
    try {
      const response = await axios.get(backendUrl + '/api/delivery/live-locations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setLocations(response.data.locations);
      }
    } catch (error) {
      console.error('Error fetching live locations:', error);
      toast.error('Failed to load live locations');
    }
  };

  useEffect(() => {
    if (token) {
      fetchLiveLocations();
    }
  }, [token]);

  useEffect(() => {
    if (socket) {
      const handleLocationUpdate = (newLoc) => {
        setLocations((prev) => {
          const index = prev.findIndex((loc) => loc.deliveryId === newLoc.deliveryId);
          if (index > -1) {
            const updated = [...prev];
            updated[index] = newLoc;
            return updated;
          } else {
            return [...prev, newLoc];
          }
        });
      };
      
      socket.on('live-location-update', handleLocationUpdate);
      return () => {
        socket.off('live-location-update', handleLocationUpdate);
      };
    }
  }, [socket]);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView(centerCoords.ALL, 9);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);
    }
    
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Map Center based on Hub Filter
  useEffect(() => {
    if (mapInstanceRef.current) {
      const currentCenter = centerCoords[hubFilter] || centerCoords.ALL;
      const currentZoom = hubFilter === 'ALL' ? 9 : 12;
      mapInstanceRef.current.setView(currentCenter, currentZoom);
    }
  }, [hubFilter]);

  // Update Markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const validLocations = locations.filter(loc => loc.lat && loc.lng);
    const activeIds = new Set(validLocations.map(loc => loc.deliveryId));

    // Remove stale markers
    Object.keys(markersRef.current).forEach(id => {
      if (!activeIds.has(id)) {
        mapInstanceRef.current.removeLayer(markersRef.current[id]);
        delete markersRef.current[id];
      }
    });

    // Add or update markers
    validLocations.forEach(loc => {
      const secondsAgo = Math.floor((Date.now() - loc.timestamp) / 1000);
      const isStale = secondsAgo > 300;
      const statusText = isStale ? `Last updated: ${Math.floor(secondsAgo / 60)} mins ago` : 'Live (Active now)';
      const colorClass = isStale ? 'text-red-500' : 'text-green-500';

      const popupContent = `
        <div style="padding: 4px;">
          <h3 style="font-weight: bold; margin: 0 0 2px 0; color: #1f2937;">${loc.name}</h3>
          <p style="margin: 0 0 4px 0; color: #4b5563; font-size: 12px;">${loc.phone}</p>
          <p class="${colorClass}" style="margin: 0; font-size: 10px;">${statusText}</p>
        </div>
      `;

      if (markersRef.current[loc.deliveryId]) {
        // Update existing
        markersRef.current[loc.deliveryId].setLatLng([loc.lat, loc.lng]);
        markersRef.current[loc.deliveryId].setPopupContent(popupContent);
      } else {
        // Create new
        const marker = L.marker([loc.lat, loc.lng])
          .bindPopup(popupContent)
          .addTo(mapInstanceRef.current);
        markersRef.current[loc.deliveryId] = marker;
      }
    });
  }, [locations]);

  return (
    <div className="p-4 sm:p-6 bg-white min-h-[85vh] rounded-2xl shadow-sm border border-gray-100 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Live GPS Tracking</h2>
          <p className="text-sm text-gray-500 mt-1">Real-time location of active Wishmasters</p>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600 font-medium">Focus Area:</label>
          <select 
            value={hubFilter} 
            onChange={(e) => setHubFilter(e.target.value)} 
            className="px-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 bg-gray-50 text-gray-700"
          >
            <option value="ALL">All Hubs</option>
            <option value="NAGPUR">Nagpur Hub</option>
            <option value="WARDHA">Wardha Hub</option>
            <option value="DHAMANGAON">Dhamangaon Hub</option>
          </select>
        </div>
      </div>

      <div className="flex-1 min-h-[500px] rounded-xl overflow-hidden shadow-inner border border-gray-200 relative">
        {/* The Raw Leaflet Map Container */}
        <div ref={mapRef} style={{ height: '100%', width: '100%', minHeight: '500px' }} />
        
        {/* Status Overlay */}
        <div className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg shadow-md z-[1000] border border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm font-semibold text-gray-700">{locations.length} Online</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMap;
