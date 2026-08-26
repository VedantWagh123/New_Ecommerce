import express from 'express'
import { listProducts, addProduct, removeProduct, singleProduct, getAllProductsAdmin, getPendingProducts, approveProduct, rejectProduct } from '../controllers/productController.js'
import upload from '../middleware/multer.js';
import adminAuth from '../middleware/adminAuth.js';
import roleAuth from '../middleware/roleAuth.js';

const productRouter = express.Router();

productRouter.post('/add',adminAuth,roleAuth(['super_admin']),upload.fields([{name:'image1',maxCount:1},{name:'image2',maxCount:1},{name:'image3',maxCount:1},{name:'image4',maxCount:1}]),addProduct);
productRouter.post('/remove',adminAuth,roleAuth(['super_admin']),removeProduct);
productRouter.post('/single',singleProduct);
productRouter.get('/list',listProducts)

// Admin product approval routes
productRouter.get('/admin-list', adminAuth, roleAuth(['super_admin']), getAllProductsAdmin);
productRouter.get('/pending', adminAuth, roleAuth(['super_admin']), getPendingProducts);
productRouter.post('/approve', adminAuth, roleAuth(['super_admin']), approveProduct);
productRouter.post('/reject', adminAuth, roleAuth(['super_admin']), rejectProduct);

export default productRouter