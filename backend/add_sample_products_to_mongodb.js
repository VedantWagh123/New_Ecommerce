import 'dotenv/config';
import connectDB from './config/mongodb.js';
import productModel from './models/productModel.js';

const sampleProducts = [
  {
    name: "Men Black Oversized Cotton T-Shirt",
    description: "Premium heavy cotton oversized fit t-shirt with classic round neck.",
    price: 1199,
    image: ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60"],
    category: "Men",
    subCategory: "Topwear",
    sizes: ["S", "M", "L", "XL"],
    colors: ["black"],
    fit: "Oversized",
    fabric: "Cotton",
    material: "100% Pure Cotton",
    occasion: "Casual",
    bestseller: true,
    averageRating: 4.6,
    totalReviews: 28,
    returnAvailable: true,
    cashOnDelivery: true,
    date: Date.now()
  },
  {
    name: "Men Regular Fit Pure Black Tee",
    description: "Classic everyday regular-fit black crewneck t-shirt.",
    price: 899,
    image: ["https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&auto=format&fit=crop&q=60"],
    category: "Men",
    subCategory: "Topwear",
    sizes: ["S", "M", "L", "XL"],
    colors: ["black"],
    fit: "Regular",
    fabric: "Cotton",
    material: "100% Cotton",
    occasion: "Casual",
    bestseller: false,
    averageRating: 4.5,
    totalReviews: 42,
    returnAvailable: true,
    cashOnDelivery: true,
    date: Date.now()
  },
  {
    name: "Men Tapered Fit Slim Denim Jeans",
    description: "Stretchable dark blue tapered denim jeans for casual wear.",
    price: 1899,
    image: ["https://images.unsplash.com/photo-1542272604-780c96856592?w=500&auto=format&fit=crop&q=60"],
    category: "Men",
    subCategory: "Bottomwear",
    sizes: ["30", "32", "34"],
    colors: ["blue", "dark blue"],
    fit: "Slim Fit",
    fabric: "Denim",
    material: "98% Cotton 2% Elastane",
    occasion: "College / Party",
    bestseller: true,
    averageRating: 4.7,
    totalReviews: 35,
    returnAvailable: true,
    cashOnDelivery: true,
    date: Date.now()
  },
  {
    name: "Women Floral Print Summer Dress",
    description: "Elegant lightweight floral print maxi dress.",
    price: 1799,
    image: ["https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500&auto=format&fit=crop&q=60"],
    category: "Women",
    subCategory: "Topwear",
    sizes: ["S", "M", "L"],
    colors: ["white", "pink"],
    fit: "Relaxed",
    fabric: "Rayon",
    material: "Soft Rayon",
    occasion: "Party / Casual",
    bestseller: true,
    averageRating: 4.8,
    totalReviews: 50,
    returnAvailable: true,
    cashOnDelivery: true,
    date: Date.now()
  }
];

async function seed() {
  await connectDB();
  const existingCount = await productModel.countDocuments();
  if (existingCount === 0) {
    await productModel.insertMany(sampleProducts);
    console.log('Successfully seeded 4 real products into MongoDB database catalog!');
  } else {
    console.log(`MongoDB already has ${existingCount} products.`);
  }
  process.exit(0);
}

seed();
