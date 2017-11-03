const express = require('express');
const router = express.Router();
const faker = require('faker');
// const db = require('../db/index.js');
const _ = require('lodash');
const moment = require('moment');
// Uncomment below to test database
const db = require('../../db/test.js');

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

//Add Amazon's main categories and random fraud risk
router.get('/categories', (req, res) => 
  Promise.all(categories.map((category, index) => db.addNewCategory(category, index, Math.floor(Math.random() * 100))))
  .then(success => res.send(success))
  .catch(err => console.log(err))
);

//Generate 1k random devices
router.get('/devices', (req, res) => {
  let deviceList = ['nexus', 'iphone', 'ipad', 'motorola'];
  let osList = ['android', 'ios', 'windows'];
  const promisesArray = [];

  _.times(1000, x => {
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
  });

  return Promise.all(promisesArray)
  .then(success => res.send(success))
  .catch(err => console.log(err))
});


router.get('/orders', (req, res) => {
  const generations = 10000;

  //Generate 99% legit orders
  const legitOrdersGenerated = [];
  _.times(generations * 0.99, x => {
    let randomState = faker.address.stateAbbr();
    let randomZip = faker.address.zipCode();
    let orderObj = {
      order: {
        user_id: Math.floor(Math.random() * 10000), 
        billing_state: randomState,
        billing_zip: randomZip,
        billing_country: 'USA',
        shipping_state: randomState,
        shipping_zip: randomZip,
        shipping_country: 'USA',
        total_price: faker.commerce.price(),
        purchased_at: moment(faker.date.between('2017-07-25', '2017-10-25')).utc().format("YYYY-MM-DD HH:mm:ss"),
        std_dev_from_aov: Math.floor(Math.random() * 2)
      },
      // items: [
      //   {
      //     item_id: 123456789012,
      //     quantity: 3
      //   },
      //   {
      //     item_id: 123456789011,
      //     quantity: 2
      //   }
      // ]
    };

    let o = orderObj.order;
    return db.addNewOrder(
      o.user_id, 
      o.billing_state, 
      o.billing_zip,
      o.billing_country,
      o.shipping_state, 
      o.shipping_zip,
      o.shipping_country,
      o.total_price,
      o.purchased_at,
      o.std_devs_from_aov
    )
    .then(({insertId}) => {
      // Generate 2 items in order
      const itemsGenerated = [];
        _.times(2, x => {
          let item = {
            category_id: Math.floor(Math.random() * categories.length),
            order_id: insertId,
            quantity: Math.floor(Math.random() * 4),
          };
          itemsGenerated.push(db.addNewItemFromOrder(item.category_id, item.order_id, item.quantity));
        })
      return Promise.all(itemsGenerated)
    })
  })
  return Promise.all(legitOrdersGenerated)
  .then(x => {
    const fraudOrdersGenerated = [];
    _.times(generations * 0.01, x => {
      let orderObj = {
        order: {
          user_id: Math.floor(Math.random() * 10000), 
          billing_state: faker.address.stateAbbr(),
          billing_zip: faker.address.zipCode(),
          billing_country: 'USA',
          shipping_state: faker.address.stateAbbr(),
          shipping_zip: faker.address.zipCode(),
          shipping_country: 'USA',
          total_price: faker.commerce.price(),
          purchased_at: moment(faker.date.between('2017-07-25', '2017-10-25')).utc().format("YYYY-MM-DD HH:mm:ss"),
          std_dev_from_aov: Math.floor(Math.random() * 8)
        },
        // items: [
        //   {
        //     item_id: 123456789012,
        //     quantity: 3
        //   },
        //   {
        //     item_id: 123456789011,
        //     quantity: 2
        //   }
        // ]
      };

      let o = orderObj.order;
      return db.addNewOrder(
        o.user_id, 
        o.billing_state, 
        o.billing_zip,
        o.billing_country,
        o.shipping_state, 
        o.shipping_zip,
        o.shipping_country,
        o.total_price,
        o.purchased_at,
        o.std_devs_from_aov
        )
      .then(({insertId}) => {
        // Generate 2 items in order
        const itemsGenerated = [];
          _.times(2, x => {
            _.times(2, x => {
              let item = {
                category_id: Math.floor(Math.random() * categories.length),
                order_id: insertId,
                quantity: Math.floor(Math.random() * 4),
              };
              itemsGenerated.push(db.addNewItemFromOrder(item.category_id, item.order_id, item.quantity));
            })
          })
        return Promise.all(itemsGenerated)
      })
    })
  return Promise.all(fraudOrdersGenerated)
  })
  .then(success => res.send(success))
  .catch(err => console.log(err))
});

module.exports = router;