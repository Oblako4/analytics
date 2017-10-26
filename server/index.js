const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const faker = require('faker');
const db = require('../db/index.js');
const _ = require('lodash');
const moment = require('moment');

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

//serve up static html
app.use(express.static(__dirname + '/../client'));

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

//***IMPORTANT*** If category table is empty, you cannot add orders***
app.get('/categories', (req, res) => {
  return Promise.all(
    categories.map((category, index) => db.addNewCategory(category, index))
    )
    .then(success => res.send(success))
    .catch(err => console.log(err))
});

app.get('/orders', (req, res) => {
  //generates 100 orders
  //current fraud rate = 1%
  //99 will be legitimate
    let promisesArray = [];
    let order_id = 0; //this is here so that order_id will be accessible by generate item fxn

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

      order.order.order_id = order_id = Math.floor(Math.random() * 10000);
      order.order.user_id = Math.floor(Math.random() * 10000);
      order.order.billing_state = order.order.shipping_state = faker.address.stateAbbr();
      order.order.billing_zip = order.order.shipping_zip = faker.address.zipCode();
      order.order.billing_country = order.order.shipping_country = 'USA';
      order.order.total_price = faker.commerce.price();
      order.order.purchased_at = moment(faker.date.between('2017-07-25', '2017-10-25')).format("YYYY-MM-DD HH:mm:ss");
      order.order.std_devs_from_aov = Math.floor(Math.random() * 3);

      // generate items in order
      let items = [];

      //generate 2 items
      _.times(2, () => {
        let item = {
          item_id: 123456789012,
          quantity: 3
        };
        item.item_id = Math.floor(Math.random() * 1000);
        item.category_id = Math.floor(Math.random() * categories.length);
        item.order_id = order_id;
        item.quantity = Math.floor(Math.random() * 4);
        promisesArray.push(db.addNewItemFromOrder(item.item_id, item.category_id, item.order_id, item.quantity));
      });

      promisesArray.push(db.addNewOrder(
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
      ));
    });

    //fraud order
    let fraudOrder = {};
    fraudOrder.id = Math.floor(Math.random() * 10000);
    fraudOrder.billing_state = faker.address.stateAbbr();
    fraudOrder.billing_zip = faker.address.zipCode();
    fraudOrder.billing_country = 'USA';
    fraudOrder.shipping_state = faker.address.stateAbbr();
    fraudOrder.shipping_zip = faker.address.zipCode();
    fraudOrder.shipping_country = 'USA';
    fraudOrder.total_price = faker.commerce.price();
    fraudOrder.purchased_at = moment(faker.date.between('2017-07-25', '2017-10-25')).format("YYYY-MM-DD HH:mm:ss");
    fraudOrder.std_devs_from_aov = Math.floor(Math.random() * 3);

    promisesArray.push(
      db.addNewOrder(
        fraudOrder.id, 
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
        )
    );
    return Promise.all(promisesArray)
    .then(success => res.send(success))
    .catch(err => console.log(err))
});

app.get('/devices', (req, res) => {
  let deviceList = ['nexus', 'iphone', 'ipad'];
  let osList = ['android', 'ios', 'windows'];
  let promisesArray = [];
  let device = {};
  device.user_id = Math.floor(Math.random() * 10000);
  device.device_name = deviceList[Math.floor(Math.random() * deviceList.length)];
  device.device_os = osList[Math.floor(Math.random() * osList.length)];
  device.logged_in_at = moment(faker.date.between('2017-07-25', '2017-10-25')).format("YYYY-MM-DD HH:mm:ss");

  promisesArray.push(
    db.addNewDevice(
      device.user_id, 
      device.device_name, 
      device.device_os, 
      device.logged_in_at
    )
  );
  return Promise.all(promisesArray)
  .then(success => res.send(success))
  .catch(err => console.log(err))
});

app.listen(3000, function() {
  console.log('listening on port 3000!');
});