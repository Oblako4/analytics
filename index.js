const faker = require('faker');
const db = require('./db/index.js');
const _ = require('lodash');
//add categories


const categories = [
  'Amazon Device Accessories',
  'Amazon Kindle',
  'Automotive & Powersports',
  'Baby Products (Excluding Apparel)',
  'Beauty',
  'Books',
  'Business Products (B2B)',
  'Camera & Photo',
  'Clothing & Accessories',
  'Collectible Coins',
  'Electronics (Accessories)',
  'Fine Art',
  'Grocery & Gourmet Food',
  'Handmade',
  'Health & Personal Care',
  'Historical & Advertising Collectibles',
  'Home & Garden',
  'Industrial & Scientific',
  'Jewelry',
  'Luggage & Travel Accessories',
  'Music',
  'Musical Instruments',
  'Sports Collectibles',
  'Tools & Home Improvement',
  'Personal Computers',
  'Professional Services',
  'Shoes, Handbags & Sunglasses',
  'Software & Computer Games',
  'Sports',
  'Sports Collectibles',
  'Tools & Home Improvement',
  'Toys & Games',
  'Video, DVD & Blu-Ray',
  'Video Games & Video Game Consoles',
  'Watches'
];

const generateCategories = () => {
  categories.forEach(category => {
    db.addNewCategory(category);
  });
}

//generate items
const generateItems = (number) => {
  _.times(number, () => {
    let item = {};
    item.category_id = Math.floor(Math.random() * categories.length);
    item.order_id = Math.floor(Math.random() * 10000); //change number to total num of products
    item.quantity = Math.floor(Math.random() * 4);
    db.addNewItem(item);
  });
};

//generate orders


//generate devices
const generateDevices = (number) => {
  const deviceList = ['android', 'ios'];
  const osList = [];
  _.times(number, () => {
    let device = {};
    device.user_id = Math.floor(Math.random() * 100);
    device.name = deviceList[Math.floor(Math.random() * deviceList.length)];
    device.os = osList[Math.floor(Math.random() * osList.length)];
    db.addNewDevice(device);
  });
};