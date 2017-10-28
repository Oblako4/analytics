const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const faker = require('faker');
const db = require('../db/index.js');
const _ = require('lodash');
const moment = require('moment');
const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'trace'
});

app.use(bodyParser.urlencoded({extended: true}));
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

//Add Amazon's main categories and random fraud risk
app.get('/categories', (req, res) => 
  Promise.all(categories.map((category, index) => db.addNewCategory(category, index, Math.floor(Math.random() * 100))))
  .then(success => res.send(success))
  .catch(err => console.log(err))
);

//Generate 1k random devices
app.get('/devices', (req, res) => {
  let deviceList = ['nexus', 'iphone', 'ipad'];
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

app.post('/fraud', (req, res) => {
  //Algorithm parameters
  const algWeight = 25;
  const acceptableAOVStdDev = 2;
  const acceptableNumOfDevices = 3;

  let fraud_score = 0;
  const order_id = req.body.order.order_id;
  let global_user_id;
  const items = req.body.items;

  //Search for order by order ID
  return db.searchOrders(order_id)
  //Grab only the first result
  .then(orderResult => orderResult[0])

  //*** INFO FROM ORDERS ***
  .then(({billing_name, shipping_name, billing_state, shipping_state, user_id, std_devs_from_aov}) => {
    //compare billing and shipping state
    fraud_score += billing_state === shipping_state ? 0 : algWeight;
    //Check if order total is unusually high
    fraud_score += std_devs_from_aov > acceptableAOVStdDev ? 0 : algWeight;
    global_user_id = user_id;
    return user_id;
  })

  //*** INFO FROM USER ***
  //Search for a user's devices
  .then(user_id => db.searchDevices(user_id))
  // determine if # of devices is high
  .then(deviceResult => fraud_score += deviceResult.length > acceptableNumOfDevices ? 0 : algWeight)

  //*** INFO FROM INVENTORY ***
  //Determine if order has items from high-risk categories
  .then( x => 
    //Get category id for each item in order
    Promise.all(items.map(({item_id}) => db.searchItems(item_id))))
  //Get category fraud risk for each item
  .then(category_ids => Promise.all(category_ids[0].map(({category_id}) => db.getCategoryFraudRisk(category_id))))
  //Sum category fraud risk scores
  .then(arrayOfCategoryFraudRisk => arrayOfCategoryFraudRisk.reduce((acc, cur) => acc + cur[0].fraud_risk, 0))
  .then(totalCategoriesFraudRisk => {
    //Increment fraud score if category risk is over 30
    fraud_score += totalCategoriesFraudRisk < 80 ? 0 : algWeight; 
    //Update fraud score for order in database
    db.updateFraudScore(global_user_id, fraud_score);
    res.send('total fraud risk ' + fraud_score); 
  })
  .catch(err => console.log(err))
});

app.get('/orders', (req, res) => {
  const generations = 100;

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

app.listen(3000, function() {
  console.log('listening on port 3000!');
});