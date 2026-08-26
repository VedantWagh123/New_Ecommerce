import 'dotenv/config';
import connectDB from './config/mongodb.js';
import productModel from './models/productModel.js';

async function check() {
  await connectDB();
  const count = await productModel.countDocuments();
  console.log('MongoDB Product Count:', count);
  const products = await productModel.find({}).limit(5).lean();
  console.log('Sample Products:', products);
  process.exit(0);
}

check();
