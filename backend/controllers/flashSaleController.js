import flashSaleModel from '../models/flashSaleModel.js';
import productModel from '../models/productModel.js';

/**
 * Get active Flash Sale configuration & selected products
 * GET /api/flash-sale/active
 */
export const getActiveFlashSale = async (req, res) => {
    try {
        let flashSale = await flashSaleModel.findOne().sort({ createdAt: -1 }).populate('selectedProducts.productId');
        
        // If no configuration exists, seed a default one with 24 hours validity
        if (!flashSale) {
            const defaultProducts = await productModel.find({}).limit(4);
            const defaultEndTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

            flashSale = await flashSaleModel.create({
                title: 'LIMITED TIME MIDNIGHT SALE',
                subtitle: 'Exclusive Flash Deals — Up to 40% OFF',
                isActive: true,
                endTime: defaultEndTime,
                discountPercent: 35,
                stockClaimedPercent: 85,
                selectedProducts: defaultProducts.map((p, idx) => ({
                    productId: p._id,
                    discountPercent: 35,
                    allocatedStock: 50,
                    claimedStock: 42 + idx * 2
                }))
            });

            flashSale = await flashSaleModel.findById(flashSale._id).populate('selectedProducts.productId');
        }

        res.json({
            success: true,
            flashSale
        });
    } catch (error) {
        console.error("Get Flash Sale Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Admin: Update Flash Sale configuration & selected products
 * POST /api/flash-sale/update
 */
export const updateFlashSale = async (req, res) => {
    try {
        const { 
            title, 
            subtitle, 
            isActive, 
            endTime, 
            discountPercent, 
            stockClaimedPercent, 
            selectedProducts 
        } = req.body;

        let flashSale = await flashSaleModel.findOne().sort({ createdAt: -1 });

        if (flashSale) {
            flashSale.title = title !== undefined ? title : flashSale.title;
            flashSale.subtitle = subtitle !== undefined ? subtitle : flashSale.subtitle;
            flashSale.isActive = isActive !== undefined ? isActive : flashSale.isActive;
            flashSale.endTime = endTime ? new Date(endTime) : flashSale.endTime;
            flashSale.discountPercent = discountPercent !== undefined ? discountPercent : flashSale.discountPercent;
            flashSale.stockClaimedPercent = stockClaimedPercent !== undefined ? stockClaimedPercent : flashSale.stockClaimedPercent;
            
            if (Array.isArray(selectedProducts)) {
                flashSale.selectedProducts = selectedProducts;
            }

            await flashSale.save();
        } else {
            flashSale = await flashSaleModel.create({
                title: title || 'LIMITED TIME MIDNIGHT SALE',
                subtitle: subtitle || 'Exclusive Flash Deals — Up to 40% OFF',
                isActive: isActive !== undefined ? isActive : true,
                endTime: endTime ? new Date(endTime) : new Date(Date.now() + 24 * 60 * 60 * 1000),
                discountPercent: discountPercent || 35,
                stockClaimedPercent: stockClaimedPercent || 85,
                selectedProducts: selectedProducts || []
            });
        }

        const updated = await flashSaleModel.findById(flashSale._id).populate('selectedProducts.productId');

        res.json({
            success: true,
            message: "Flash Sale configuration updated successfully!",
            flashSale: updated
        });
    } catch (error) {
        console.error("Update Flash Sale Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
