import 'dotenv/config';
import connectDB from './config/mongodb.js';
import productModel from './models/productModel.js';

async function clear() {
  await connectDB();
  const res = await productModel.deleteMany({});
  console.log(`Cleared ${res.deletedCount} test products from MongoDB.`);
  process.exit(0);
}

clear();
