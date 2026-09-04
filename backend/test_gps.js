import { io } from 'socket.io-client';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import axios from 'axios';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("JWT_SECRET is required in .env");
    process.exit(1);
}

// 1. Mock a Delivery Boy Token
const deliveryBoyId = "66d6a578a1f81cf0989fbaaa"; // A dummy ID
const token = jwt.sign({ id: deliveryBoyId, role: 'delivery' }, JWT_SECRET, { expiresIn: '1h' });

// 2. Connect Socket
const socket = io('http://localhost:4000', {
    auth: { token, role: 'delivery' }
});

socket.on('connect', async () => {
    console.log('✅ Connected to Socket as Delivery Boy');

    // 3. Simulate Movement in Nagpur
    let lat = 21.1458;
    let lng = 79.0882;

    for (let i = 0; i < 5; i++) {
        lat += 0.001; // move north
        lng += 0.001; // move east

        console.log(`📡 Emitting location: ${lat}, ${lng}`);
        socket.emit('update-location', { lat, lng });

        // Wait 1 second
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 4. Verify Admin API
    try {
        const adminToken = jwt.sign({ id: 'admin123', role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
        const res = await axios.get('http://localhost:4000/api/delivery/live-locations', {
            headers: { Authorization: `Bearer ${adminToken}`, 'x-role': 'admin' }
        });
        
        console.log('\n--- ADMIN LIVE LOCATIONS API ---');
        console.log(res.data);
        if (res.data.locations.length > 0) {
            console.log('✅ Success! Redis stored the live locations.');
        } else {
            console.error('❌ Failed! Redis did not return locations.');
        }
    } catch (err) {
        console.error("❌ API Error:", err.response?.data || err.message);
    }

    socket.disconnect();
    process.exit(0);
});

socket.on('connect_error', (err) => {
    console.error('❌ Socket connection error:', err.message);
    process.exit(1);
});
