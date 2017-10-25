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
const generate100nOrders = (number) => {
  _.times(number, () => {
    _.times(99, () => {
      let order = {};
      order.user_id = Math.floor(Math.random() * 10000);
      order.billing_state = order.shipping_state = faker.stateAbbr();
      order.billing_zip = order.shipping_zip = faker.zipCode();
      order.billing_country = order.shipping_country = fake.country();
      order.total_price = faker.price();
      order.purchased_at = faker.recent();
      order.std_devs_from_aov = Math.floor(Math.random() * 3);
      db.addNewOrder(order);
    });

    //fraud order
    let fraudOrder = {};
    fraudOrder.user_id = Math.floor(Math.random() * 10000);
    fraudOrder.billing_state = faker.stateAbbr();
    fraudOrder.billing_zip = faker.zipCode();
    fraudOrder.billing_country = fake.country();
    fraudOrder.shipping_state = faker.stateAbbr();
    fraudOrder.shipping_zip = faker.zipCode();
    fraudOrder.shipping_country = fake.country();
    fraudOrder.total_price = faker.price();
    fraudOrder.purchased_at = faker.recent();
    fraudOrder.std_devs_from_aov = Math.floor(Math.random() * 3);
    db.addNewOrder(fraudOrder);
  });
};

//generate devices
const generateDevices = (number) => {
  const deviceList = ['nexus', 'iphone', 'ipad'];
  const osList = ['android', 'ios', 'windows'];
  _.times(number, () => {
    let device = {};
    device.user_id = Math.floor(Math.random() * 10000);
    device.name = deviceList[Math.floor(Math.random() * deviceList.length)];
    device.os = osList[Math.floor(Math.random() * osList.length)];
    db.addNewDevice(device);
  });
};