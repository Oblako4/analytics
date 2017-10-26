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
    let item = {
      order: {},
      items: []
    };
    item.category_id = Math.floor(Math.random() * categories.length);
    item.order_id = Math.floor(Math.random() * 10000); //change number to total num of products
    item.quantity = Math.floor(Math.random() * 4);
    db.addNewItem(item);
  });
};

//generate orders
const generateOrders = (number) => {
  //generate 100 * number orders
  _.times(number, () => {
    //current fraud rate = 1%
    //99 will be legitimate
    _.times(99, () => {
      let order = {
        order: {
          order_id: 123456789, 
          user_id: 123456789, 
          billing_state: 'MA',
          billing_ZIP: 01609,
          billing_country: 'US',
          shipping_state: 'MI',
          shipping_zip: 48127,
          shipping_country: 'US',
          total_price: 23.99,
          purchased_At: '', //will be a date object
          std_dev_from_aov: -2
        },
        items: [
          {
            item_id: 123456789012,
            quantity: 3
          },
          {
            item_id: 123456789011,
            quantity: 2
          }
        ]
      };

      order.order.order_id = Math.floor(Math.random() * 10000);
      order.order.user_id = Math.floor(Math.random() * 10000);
      order.order.billing_state = order.order.shipping_state = faker.stateAbbr();
      order.order.billing_zip = order.order.shipping_zip = faker.zipCode();
      order.order.billing_country = order.order.shipping_country = fake.country();
      order.order.total_price = faker.price();
      order.order.purchased_at = faker.recent();
      order.order.std_devs_from_aov = Math.floor(Math.random() * 3);

      //generate items in order
      let items = [];

      //generate 2 items
      _.times(2, () => {
        let item = {
          item_id: 123456789012,
          quantity: 3
        };
        item.item_id = Math.floor(Math.random() * categories.length);
        item.quantity = Math.floor(Math.random() * 4);
        db.addNewItemFromOrder(item.item_id);
      });
      db.addNewOrder(
        order.order.order_id, 
        order.order.user_id, 
        order.order.billing_state, 
        order.order.billing_zip,
        order.order.billing_country,
        order.order.shipping_state, 
        order.order.shipping_zip,
        order.order.shipping_country,
        order.order.total_price,
        order.order.purchased_at,
        order.order.std_devs_from_aov
        );
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
    db.addNewOrder(
      fraudOrder.order_id, 
      fraudOrder.user_id, 
      fraudOrder.billing_state, 
      fraudOrder.billing_zip,
      fraudOrder.billing_country,
      fraudOrder.shipping_state, 
      fraudOrder.shipping_zip,
      fraudOrder.shipping_country,
      fraudOrder.total_price,
      fraudOrder.purchased_at,
      fraudOrder.std_devs_from_aov
    );
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
    db.addNewDevice(device.user_id, device.device_name, device.device_os, device.logged_in_at);
  });
};