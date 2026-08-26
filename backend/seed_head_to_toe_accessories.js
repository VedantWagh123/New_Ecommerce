import 'dotenv/config';
import connectDB from './config/mongodb.js';
import productModel from './models/productModel.js';

const accessoriesToSeed = [
  {
    name: "Men Classic Leather Chronograph Watch",
    description: "Premium stainless steel case with genuine brown leather strap and water-resistant dial.",
    price: 1299,
    image: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60"],
    category: "Men",
    subCategory: "Accessories",
    sizes: ["ONE SIZE"],
    colors: ["brown", "black"],
    fit: "Regular",
    fabric: "Leather & Steel",
    material: "Stainless Steel & Genuine Leather",
    occasion: "College / Party / Executive",
    bestseller: true,
    averageRating: 4.8,
    totalReviews: 64,
    returnAvailable: true,
    cashOnDelivery: true,
    date: Date.now()
  },
  {
    name: "Men Polarized Retro Square Sunglasses",
    description: "UV400 protection matte black frame sunglasses for everyday outdoor style.",
    price: 599,
    image: ["https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&auto=format&fit=crop&q=60"],
    category: "Men",
    subCategory: "Accessories",
    sizes: ["ONE SIZE"],
    colors: ["black"],
    fit: "Regular",
    fabric: "Polycarbonate",
    material: "Lightweight Acetate",
    occasion: "Casual / Summer / College",
    bestseller: true,
    averageRating: 4.6,
    totalReviews: 38,
    returnAvailable: true,
    cashOnDelivery: true,
    date: Date.now()
  }
];

async function seedAccessories() {
  await connectDB();
  const existingCount = await productModel.countDocuments({ category: "Men", subCategory: "Accessories" });
  if (existingCount === 0) {
    await productModel.insertMany(accessoriesToSeed);
    console.log('✅ Successfully seeded Men Accessories into MongoDB database catalog!');
  } else {
    console.log(`Men Accessories already exist (${existingCount} found).`);
  }
  process.exit(0);
}

seedAccessories();
