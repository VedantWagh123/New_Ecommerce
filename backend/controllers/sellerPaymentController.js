import userModel from '../models/userModel.js';
import razorpay from 'razorpay';

let razorpayInstance = null;
try {
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        razorpayInstance = new razorpay({
            key_id : process.env.RAZORPAY_KEY_ID,
            key_secret : process.env.RAZORPAY_KEY_SECRET,
        });
    }
} catch(err) {
    console.error("Razorpay initialization error in seller route:", err);
}

export const onboardRazorpayAccount = async (req, res) => {
    try {
        const { sellerId } = req.body;
        const seller = await userModel.findById(sellerId);

        if (!seller) {
            return res.json({ success: false, message: "Seller not found" });
        }

        if (seller.razorpayAccountId) {
            return res.json({ success: false, message: "Seller is already onboarded to Razorpay Route" });
        }

        // We require basic bank details to be filled
        if (!seller.bankDetails || !seller.bankDetails.accountNumber || !seller.bankDetails.ifscCode) {
            return res.json({ success: false, message: "Please complete your bank details first" });
        }

        // Call Razorpay API to create a linked account (Route)
        // In a real production scenario, you might need to collect PAN and KYC documents depending on Razorpay's exact merchant requirements.
        // The standard Linked Account API requires 'type: route'.
        const accountPayload = {
            email: seller.email,
            phone: seller.phone || '9999999999',
            type: 'route',
            reference_id: seller._id.toString(),
            legal_business_name: seller.storeName || seller.name,
            business_type: 'individual',
            profile: {
                category: 'ecommerce',
                description: seller.storeDescription || 'Seller on Veloura Marketplace'
            }
        };

        const account = await razorpayInstance.accounts.create(accountPayload);

        if (account && account.id) {
            seller.razorpayAccountId = account.id;
            await seller.save();

            // Note: After creating the account, we also need to add the Bank Account to this Linked Account so money can settle.
            // Using Razorpay Funds API or Bank Account API. But for this MVP architecture, getting the account ID is the first step.
            
            return res.json({ success: true, message: "Successfully onboarded to Razorpay Route", accountId: account.id });
        } else {
            return res.json({ success: false, message: "Failed to create Razorpay Account" });
        }

    } catch (error) {
        console.error("Razorpay Onboarding Error:", error);
        res.json({ success: false, message: error.message || "Razorpay API error" });
    }
};
