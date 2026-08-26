import bankOfferModel from "../models/bankOfferModel.js";

/**
 * List all bank offers with product/category scope filtering
 * GET /api/bank-offer/list?adminView=true&productId=xxx&category=Men
 */
export const listBankOffers = async (req, res) => {
    try {
        const { adminView, productId, category } = req.query;

        let filter = adminView === 'true' ? {} : { isActive: true };
        const offers = await bankOfferModel.find(filter).sort({ date: -1 });

        // If this is for a specific product page, filter applicable offers
        if (adminView !== 'true' && (productId || category)) {
            const applicableOffers = offers.filter(offer => {
                if (offer.appliesTo === 'ALL_PRODUCTS' || !offer.appliesTo) {
                    return true;
                }
                if (offer.appliesTo === 'SPECIFIC_CATEGORY') {
                    return category && offer.applicableCategory?.toLowerCase() === category.toLowerCase();
                }
                if (offer.appliesTo === 'SPECIFIC_PRODUCTS') {
                    return productId && offer.applicableProducts?.includes(productId);
                }
                return true;
            });

            return res.json({
                success: true,
                offers: applicableOffers
            });
        }

        res.json({
            success: true,
            offers
        });
    } catch (error) {
        console.error("List Bank Offers Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Add a new bank offer (Admin action with Product Selection Scope)
 * POST /api/bank-offer/add
 */
export const addBankOffer = async (req, res) => {
    try {
        const { 
            bankName, badgeText, offerText, minPurchase, 
            terms, themeColor, appliesTo, applicableCategory, applicableProducts 
        } = req.body;

        if (!bankName || !badgeText || !offerText || !terms) {
            return res.status(400).json({ success: false, message: "Please fill all required fields" });
        }

        const newOffer = new bankOfferModel({
            bankName,
            badgeText,
            offerText,
            minPurchase: Number(minPurchase) || 0,
            terms,
            themeColor: themeColor || 'indigo',
            isActive: true,
            appliesTo: appliesTo || 'ALL_PRODUCTS',
            applicableCategory: applicableCategory || '',
            applicableProducts: Array.isArray(applicableProducts) ? applicableProducts : []
        });

        await newOffer.save();

        res.json({
            success: true,
            message: "Bank offer added successfully!",
            offer: newOffer
        });
    } catch (error) {
        console.error("Add Bank Offer Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Toggle Bank Offer Active Status (Admin action)
 * POST /api/bank-offer/toggle
 */
export const toggleBankOfferStatus = async (req, res) => {
    try {
        const { id } = req.body;
        const offer = await bankOfferModel.findById(id);

        if (!offer) {
            return res.status(404).json({ success: false, message: "Bank offer not found" });
        }

        offer.isActive = !offer.isActive;
        await offer.save();

        res.json({
            success: true,
            message: `Bank offer status changed to ${offer.isActive ? 'Active' : 'Inactive'}`,
            offer
        });
    } catch (error) {
        console.error("Toggle Bank Offer Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Delete a Bank Offer (Admin action)
 * POST /api/bank-offer/delete
 */
export const deleteBankOffer = async (req, res) => {
    try {
        const { id } = req.body;
        await bankOfferModel.findByIdAndDelete(id);

        res.json({
            success: true,
            message: "Bank offer deleted successfully!"
        });
    } catch (error) {
        console.error("Delete Bank Offer Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
