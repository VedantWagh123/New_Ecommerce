import 'dotenv/config';
import connectDB from './config/mongodb.js';
import bankOfferModel from './models/bankOfferModel.js';

const initialOffers = [
    {
        bankName: "HDFC BANK",
        badgeText: "10% OFF",
        offerText: "10% Instant Discount up to ₹1,500 on HDFC Cards & EMI.",
        minPurchase: 3000,
        terms: "Get 10% instant discount up to ₹1,500 on HDFC Bank Credit & Debit Cards on minimum transaction of ₹3,000. Valid once per user per month.",
        themeColor: "blue",
        isActive: true
    },
    {
        bankName: "ICICI BANK",
        badgeText: "₹750 OFF",
        offerText: "Flat ₹750 Cashback on ICICI Credit Card orders.",
        minPurchase: 2999,
        terms: "Flat ₹750 cashback credited to ICICI Credit Card account within 48 hours for purchases above ₹2,999.",
        themeColor: "amber",
        isActive: true
    },
    {
        bankName: "AXIS BANK",
        badgeText: "5% Cashback",
        offerText: "5% Unlimited Cashback on Axis Bank Credit Cards.",
        minPurchase: 0,
        terms: "Earn 5% unlimited cashback directly credited to Axis Bank Flipkart/Standard credit cards. No minimum order limit.",
        themeColor: "rose",
        isActive: true
    },
    {
        bankName: "UPI / PAYTM / PHONEPE",
        badgeText: "FLAT ₹100 OFF",
        offerText: "Flat ₹100 Instant Discount on UPI checkout.",
        minPurchase: 499,
        terms: "Get instant flat ₹100 discount at payment gateway checkout on selecting any BHIM UPI or Paytm app transaction.",
        themeColor: "teal",
        isActive: true
    }
];

async function seedBankOffers() {
    try {
        await connectDB();
        console.log('MongoDB Connected.');

        const existingCount = await bankOfferModel.countDocuments();
        if (existingCount === 0) {
            await bankOfferModel.insertMany(initialOffers);
            console.log('✅ Default Bank Offers Seeded Successfully!');
        } else {
            console.log(`ℹ️ Bank Offers already exist (${existingCount} found). Seed skipped.`);
        }
        process.exit(0);
    } catch (error) {
        console.error('❌ Seed Bank Offers Error:', error);
        process.exit(1);
    }
}

seedBankOffers();
