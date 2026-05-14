import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Product from '../models/Product.js';

const PRODUCT_IMAGES = {
  'Cleaning Products': [
    'https://images.unsplash.com/photo-1585907401140-108ecf62c0fc?w=800&q=80', // Spray
    'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=800&q=80', // Cleaning supplies
    'https://images.unsplash.com/photo-1556909211-3698a5442f4c?w=800&q=80', // Kitchen cleaning
    'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&q=80', // Vacuum
  ],
  'Beauty Products': [
    'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?w=800&q=80', // Skincare
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80', // Makeup
    'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80', // Beauty supplies
    'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&q=80', // Cosmetics
  ],
  'Home Appliances': [
    'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80', // Appliances
    'https://images.unsplash.com/photo-1558565882-95123d6a2a07?w=800&q=80', // TV/Electronics
    'https://images.unsplash.com/photo-1590756254933-2873d72a83b6?w=800&q=80', // Refrigerator
    'https://images.unsplash.com/photo-1626806787426-5910811b6325?w=800&q=80', // Washing Machine
  ],
  'Home Essentials': [
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80', // Decor
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80', // Furniture
    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80', // Interior
    'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=800&q=80', // Storage
  ],
  'Repair Accessories': [
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80', // Tools
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80', // Toolkit
    'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&q=80', // Repair
    'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800&q=80', // Hardware
  ]
};

const run = async () => {
  await connectDB();
  
  const products = await Product.find({});
  console.log(`Found ${products.length} products to update`);

  let categoryIndexes = {};

  for (const product of products) {
    const category = product.category;
    if (PRODUCT_IMAGES[category]) {
      if (categoryIndexes[category] === undefined) {
        categoryIndexes[category] = 0;
      }
      
      const images = PRODUCT_IMAGES[category];
      const imageIndex = categoryIndexes[category] % images.length;
      
      product.image = images[imageIndex];
      await product.save();
      
      categoryIndexes[category]++;
      console.log(`Updated ${product.name} with realistic image.`);
    }
  }

  await mongoose.disconnect();
  console.log('Finished updating product images.');
  process.exit(0);
};

run().catch((err) => {
  console.error('Error updating products:', err);
  process.exit(1);
});
