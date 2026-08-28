import { v2 as cloudinary } from "cloudinary"
import productModel from "../models/productModel.js"

import userModel from "../models/userModel.js"

// Helper to populate storeName on products
const enrichProductsWithStoreName = async (products) => {
    if (!Array.isArray(products)) return products;
    const sellerIds = [...new Set(products.map(p => p.sellerId).filter(Boolean))];
    const sellers = await userModel.find({ _id: { $in: sellerIds } }).select('_id storeName');
    const sellerMap = {};
    sellers.forEach(s => {
        sellerMap[s._id.toString()] = s.storeName;
    });

    return products.map(p => {
        const obj = p.toObject ? p.toObject() : { ...p };
        if (p.sellerId && sellerMap[p.sellerId.toString()]) {
            obj.storeName = sellerMap[p.sellerId.toString()];
        } else {
            obj.storeName = 'Veloura Official';
        }
        return obj;
    });
};

// function for add product
const addProduct = async (req, res) => {
    try {

        // Ensure Cloudinary is configured with environment variables
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_SECRET_KEY
        });

        const { name, description, price, category, subCategory, sizes, bestseller, isFeatured, returnAvailable, cashOnDelivery } = req.body

        const image1 = req.files.image1 && req.files.image1[0]
        const image2 = req.files.image2 && req.files.image2[0]
        const image3 = req.files.image3 && req.files.image3[0]
        const image4 = req.files.image4 && req.files.image4[0]

        const images = [image1, image2, image3, image4].filter((item) => item !== undefined)

        let imagesUrl = await Promise.all(
            images.map(async (item) => {
                let result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
                return result.secure_url
            })
        )

        const productData = {
            name,
            description,
            category,
            price: Number(price),
            subCategory,
            bestseller: bestseller === "true" ? true : false,
            isFeatured: isFeatured === "true" ? true : false,
            returnAvailable: returnAvailable === "true" ? true : false,
            cashOnDelivery: cashOnDelivery === "true" ? true : false,
            sizes: JSON.parse(sizes),
            image: imagesUrl,
            approvalStatus: 'approved', // Admin added products are live immediately
            date: Date.now()
        }

        console.log(productData);

        const product = new productModel(productData);
        await product.save()

        // Asynchronously index in Vector DB
        if (imagesUrl.length > 0) {
            import('axios').then(axios => {
                const embeddingServiceUrl = process.env.EMBEDDING_SERVICE_URL || 'http://127.0.0.1:8000';
                axios.default.post(`${embeddingServiceUrl}/index`, {
                    product_id: product._id.toString(),
                    image_url: imagesUrl[0]
                }).catch(err => console.warn('Vector indexing failed for admin product', product._id, ':', err.message));
            }).catch(() => {});
        }

        res.json({ success: true, message: "Product Added" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// function for list product (Permanent persistence for approved & legacy store products)
const listProducts = async (req, res) => {
    try {
        const dbProducts = await productModel.find({
            $or: [
                { approvalStatus: 'approved' },
                { approvalStatus: { $exists: false } },
                { approvalStatus: null }
            ]
        });
        const products = await enrichProductsWithStoreName(dbProducts);
        res.json({success:true,products})

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// function for removing product
const removeProduct = async (req, res) => {
    try {
        
        await productModel.findByIdAndDelete(req.body.id)
        res.json({success:true,message:"Product Removed"})

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// function for single product info
const singleProduct = async (req, res) => {
    try {
        
        const { productId } = req.body
        const dbProduct = await productModel.findById(productId)
        if (!dbProduct) {
            return res.json({ success: false, message: "Product not found" });
        }
        const [product] = await enrichProductsWithStoreName([dbProduct]);
        res.json({success:true,product})

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Admin: Get all products (including pending & rejected)
const getAllProductsAdmin = async (req, res) => {
    try {
        const products = await productModel.find({}).sort({ date: -1 });
        res.json({ success: true, products });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Admin: Get pending products
const getPendingProducts = async (req, res) => {
    try {
        const products = await productModel.find({ approvalStatus: 'pending' }).sort({ date: -1 });
        res.json({ success: true, products });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Admin: Approve product
const approveProduct = async (req, res) => {
    try {
        const { productId } = req.body;
        const product = await productModel.findByIdAndUpdate(productId, { approvalStatus: 'approved', rejectionReason: '' }, { new: true });
        if (!product) {
            return res.json({ success: false, message: "Product not found" });
        }
        res.json({ success: true, message: `Product "${product.name}" approved!`, product });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Admin: Reject product
const rejectProduct = async (req, res) => {
    try {
        const { productId, reason } = req.body;
        const product = await productModel.findByIdAndUpdate(productId, {
            approvalStatus: 'rejected',
            rejectionReason: reason || 'Does not meet store guidelines'
        }, { new: true });

        if (!product) {
            return res.json({ success: false, message: "Product not found" });
        }
        res.json({ success: true, message: `Product "${product.name}" rejected.`, product });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export { listProducts, addProduct, removeProduct, singleProduct, getAllProductsAdmin, getPendingProducts, approveProduct, rejectProduct }