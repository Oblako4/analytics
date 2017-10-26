const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const faker = require('faker');
const db = require('../db/index.js');
const _ = require('lodash');
const moment = require('moment');

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

//Add Amazon's main categories
app.get('/categories', (req, res) => 
  Promise.all(categories.map((category, index) => db.addNewCategory(category, index)))
  .then(success => res.send(success))
  .catch(err => console.log(err))
);

//Generate 100 orders (1% fraud rate)
app.get('/orders', (req, res) => {
  const promisesArray = [];
  let order_id = 0;

  //Generate 99 legit orders
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

    order.order.order_id = order_id = Math.floor(Math.random() * 10000000);
    order.order.user_id = Math.floor(Math.random() * 10000000);
    order.order.billing_state = order.order.shipping_state = faker.address.stateAbbr();
    order.order.billing_zip = order.order.shipping_zip = faker.address.zipCode();
    order.order.billing_country = order.order.shipping_country = 'USA';
    order.order.total_price = faker.commerce.price();
    order.order.purchased_at = moment(faker.date.between('2017-07-25', '2017-10-25')).format("YYYY-MM-DD HH:mm:ss");
    order.order.std_devs_from_aov = Math.floor(Math.random() * 3);

    // Generate 2 items in order
    _.times(2, () => {
      let item = {
        item_id: 123456789012,
        quantity: 3
      };
      item.item_id = Math.floor(Math.random() * 10000000);
      item.category_id = Math.floor(Math.random() * categories.length);
      item.order_id = order_id;
      item.quantity = Math.floor(Math.random() * 4);
      promisesArray.push(db.addNewItemFromOrder(item.item_id, item.category_id, item.order_id, item.quantity));
    });

    promisesArray.push(
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
      ));
  });

  //Generate fraud order
  let fraudOrder = {};
  fraudOrder.id = Math.floor(Math.random() * 10000000);
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

//Generate 10 random devices
app.get('/devices', (req, res) => {
  let deviceList = ['nexus', 'iphone', 'ipad'];
  let osList = ['android', 'ios', 'windows'];
  const promisesArray = [];

  _.times(10, _ => {
    let device = {};
    device.user_id = Math.floor(Math.random() * 10000000);
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
  const user_id = req.body.order.user_id;
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
    return user_id;
  })

  //*** INFO FROM USER ***
  //Search for a user's devices
  .then(user_id => db.searchDevices(user_id))
  // determine if # of devices is high
  .then(deviceResult => fraud_score += deviceResult.length > acceptableNumOfDevices ? 0 : algWeight)

  //*** INFO FROM INVENTORY ***
  //Determine if order has items from high-risk categories
  .then( _ => 
    //Get category id for each item in order
    Promise.all(items.map(({item_id}) => db.searchItems(item_id))))
  //Get category fraud risk for each item
  .then(category_ids => Promise.all(category_ids[0].map(({category_id}) => db.getCategoryFraudRisk(category_id))))
  //Sum category fraud risk scores
  .then(arrayOfCategoryFraudRisk => arrayOfCategoryFraudRisk.reduce((acc, cur) => acc + cur[0].fraud_risk, 0))
  .then(totalCategoriesFraudRisk => {
    //Increment fraud score if category risk is over 30
    fraud_score += totalCategoriesFraudRisk < 30 ? 0 : algWeight; 
    //Update fraud score for order in database
    db.updateFraudScore(user_id, fraud_score);
    res.send('total fraud risk ' + fraud_score); 
  })
  .catch(err => console.log(err))
});

app.listen(3000, function() {
  console.log('listening on port 3000!');
});