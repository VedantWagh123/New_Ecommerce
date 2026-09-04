import mongoose from 'mongoose';
import 'dotenv/config';
import connectDB from './config/mongodb.js';
import productModel from './models/productModel.js';
import userModel from './models/userModel.js';
import orderModel from './models/orderModel.js';
import { placeOrder, assignWishmaster } from './controllers/orderController.js';

const mockRes = () => {
    const res = {};
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

const runTests = async () => {
    try {
        console.log("🟡 Connecting to DB...");
        await connectDB();
        console.log("🟢 Connected to DB.");

        console.log("\n🧹 INITIAL CLEANUP...");
        await userModel.deleteMany({ email: { $in: ["customer@test.com", "nagpur_del@test.com", "wardha_del@test.com"] } });
        await productModel.deleteMany({ name: "Test Logistics Shirt" });

        console.log("\n--- TEST CASE 1: MOCK DATA INJECTION ---");
        // Create Mock Product
        const mockProduct = new productModel({
            name: "Test Logistics Shirt",
            description: "A shirt for testing routing",
            price: 500,
            image: ["http://res.cloudinary.com/demo/image.jpg"],
            category: "Men",
            subCategory: "Topwear",
            sizes: ["S", "M", "L"],
            stock: { "S": 10, "M": 5, "L": 0 },
            warehouseInventory: [
                { warehouseId: 'WH_NAGPUR', stock: 5, stockMap: { "S": 5, "M": 0, "L": 0 } },
                { warehouseId: 'WH_WARDHA', stock: 5, stockMap: { "S": 5, "M": 0, "L": 0 } },
                { warehouseId: 'WH_DHAMANGAON', stock: 5, stockMap: { "S": 0, "M": 5, "L": 0 } }
            ],
            bestseller: false,
            date: Date.now()
        });
        await mockProduct.save();

        // Create Mock Users
        const customer = new userModel({
            name: "Test Customer",
            email: "customer@test.com",
            password: "hashedpassword",
            role: "user"
        });
        await customer.save();

        const nagpurDelivery = new userModel({
            name: "Nagpur Boy",
            email: "nagpur_del@test.com",
            password: "hashedpassword",
            role: "user",
            isDeliveryPartner: true,
            deliveryStatus: 'approved',
            isDeliveryOnline: true,
            serviceCity: 'Nagpur'
        });
        await nagpurDelivery.save();

        const wardhaDelivery = new userModel({
            name: "Wardha Boy",
            email: "wardha_del@test.com",
            password: "hashedpassword",
            role: "user",
            isDeliveryPartner: true,
            deliveryStatus: 'approved',
            isDeliveryOnline: true,
            serviceCity: 'Wardha'
        });
        await wardhaDelivery.save();
        
        console.log("✅ Mock data injected.");

        console.log("\n--- TEST CASE 2: INVALID PINCODE ORDER (MUMBAI) ---");
        const reqMumbai = {
            body: {
                userId: customer._id,
                items: [{ _id: mockProduct._id, name: "Test Logistics Shirt", size: "S", quantity: 1, price: 500 }],
                amount: 500,
                address: { firstName: "Test", lastName: "Cust", street: "123", city: "Mumbai", state: "MH", zipcode: "400001", country: "India", phone: "1234567890" }
            }
        };
        const resMumbai = mockRes();
        await placeOrder(reqMumbai, resMumbai);
        
        if (resMumbai.data.success === false && resMumbai.data.message === "Delivery not available in your area.") {
            console.log("✅ Validated invalid pincode rejection.");
        } else {
            console.error("❌ Failed invalid pincode check:", resMumbai.data);
            throw new Error("Test Case 2 Failed");
        }

        // Verify stock is untouched
        const prodAfterMumbai = await productModel.findById(mockProduct._id);
        if (prodAfterMumbai.warehouseInventory.find(wh => wh.warehouseId === 'WH_NAGPUR').stockMap["S"] === 5) {
            console.log("✅ Validated stock untouched on invalid order.");
        } else {
            console.error("❌ Failed stock intact check.");
            throw new Error("Test Case 2 Failed");
        }

        console.log("\n--- TEST CASE 3: VALID PINCODE ORDER (NAGPUR) ---");
        const reqNagpur = {
            body: {
                userId: customer._id,
                items: [{ _id: mockProduct._id, name: "Test Logistics Shirt", size: "S", quantity: 2, price: 500 }],
                amount: 1000,
                address: { firstName: "Test", lastName: "Cust", street: "123", city: "Nagpur", state: "MH", zipcode: "440001", country: "India", phone: "1234567890" }
            }
        };
        const resNagpur = mockRes();
        await placeOrder(reqNagpur, resNagpur);
        
        if (resNagpur.data.success === true) {
            console.log("✅ Validated successful Nagpur order.");
        } else {
            console.error("❌ Failed Nagpur order:", resNagpur.data);
            throw new Error("Test Case 3 Failed");
        }
        
        const orderId = resNagpur.data.orderId;

        // Verify stock deduction
        const prodAfterNagpur = await productModel.findById(mockProduct._id);
        const nagpurInv = prodAfterNagpur.warehouseInventory.find(wh => wh.warehouseId === 'WH_NAGPUR');
        if (nagpurInv.stockMap["S"] === 3) {
            console.log("✅ Validated exact stock deduction (New Map).");
        } else {
            console.error("❌ Failed stock deduction logic.", { nagpurInvS: nagpurInv.stockMap["S"] });
            throw new Error("Test Case 3 Failed");
        }

        console.log("\n--- TEST CASE 4: UNAVAILABLE STOCK IN WARDHA ---");
        // Try ordering Size M from Wardha (Wardha has Size S=5, Size M=0)
        const reqWardhaFail = {
            body: {
                userId: customer._id,
                items: [{ _id: mockProduct._id, name: "Test Logistics Shirt", size: "M", quantity: 1, price: 500 }],
                amount: 500,
                address: { firstName: "Test", lastName: "Cust", street: "123", city: "Wardha", state: "MH", zipcode: "442001", country: "India", phone: "1234567890" }
            }
        };
        const resWardhaFail = mockRes();
        await placeOrder(reqWardhaFail, resWardhaFail);
        
        if (resWardhaFail.data.success === false && resWardhaFail.data.message.includes("out of stock in your region")) {
            console.log("✅ Validated regional out-of-stock rejection.");
        } else {
            console.error("❌ Failed regional stock rejection:", resWardhaFail.data);
            throw new Error("Test Case 4 Failed");
        }

        console.log("\n--- TEST CASE 5: DELIVERY HUB ROUTING VALIDATION ---");
        // Force order status to "Ready for Pickup" for assignment to work
        await orderModel.findByIdAndUpdate(orderId, { status: "Ready for Pickup" });

        // Try to assign Wardha Delivery Boy to Nagpur Order
        const reqAssignFail = { body: { orderId: orderId, partnerId: wardhaDelivery._id } };
        const resAssignFail = mockRes();
        await assignWishmaster(reqAssignFail, resAssignFail);
        if (resAssignFail.data.success !== false || !resAssignFail.data.message.includes('Cannot assign order from WH_NAGPUR')) {
            console.error("❌ Failed cross-hub assignment rejection:", resAssignFail.data);
            throw new Error("Test Case 5 Failed");
        }
        console.log("✅ Validated strict cross-hub assignment rejection.");

        // Try to assign Nagpur Delivery Boy
        const reqAssignPass = { body: { orderId: orderId, partnerId: nagpurDelivery._id } };
        const resAssignPass = mockRes();
        await assignWishmaster(reqAssignPass, resAssignPass);
        if (resAssignPass.data.success !== true) {
            console.error("❌ Failed local hub assignment:", resAssignPass.data);
            throw new Error("Test Case 5 Failed");
        }
        console.log("✅ Validated successful local hub assignment.");

        console.log("\n--- TEST CASE 6: STRICT WAREHOUSE TRANSITIONS ---");
        const { updateStatus } = await import('./controllers/orderController.js');
        
        // Reset status to 'Packing' for testing transition
        await orderModel.findByIdAndUpdate(orderId, { status: "Packing" });

        // Attempt illegal jump from Packing to Ready for Pickup
        const reqJump = { body: { orderId, status: "Ready for Pickup", updatedBy: "Admin" } };
        const resJump = mockRes();
        await updateStatus(reqJump, resJump);
        if (resJump.data.success !== false) {
            console.error("❌ Failed to block illegal status jump:", resJump.data);
            throw new Error("Test Case 6 Failed");
        }
        console.log("✅ Validated strict blocking of status jumps.");

        // Attempt legal step: Packing to Packed
        const reqLegal = { body: { orderId, status: "Packed", updatedBy: "Admin" } };
        const resLegal = mockRes();
        await updateStatus(reqLegal, resLegal);
        if (resLegal.data.success !== true) {
            console.error("❌ Failed legal transition to Packed:", resLegal.data);
            throw new Error("Test Case 6 Failed");
        }
        console.log("✅ Validated successful linear transition to Packed.");

        console.log("\n🧹 CLEANUP PHASE...");
        await productModel.findByIdAndDelete(mockProduct._id);
        await userModel.deleteMany({ _id: { $in: [customer._id, nagpurDelivery._id, wardhaDelivery._id] } });
        await orderModel.findByIdAndDelete(orderId);
        console.log("✅ Cleanup complete.");

        console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! The 3-City Routing Engine is Production-Ready.");
        process.exit(0);

    } catch (err) {
        console.error("\n❌ TEST SUITE FAILED:");
        console.error(err);
        process.exit(1);
    }
};

runTests();
