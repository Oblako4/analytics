const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const db = require('../db/index.js');
const moment = require('moment');
const { inbox, usersOutbox, ordersOutbox, inventoryOutbox } = require ('../config.js');
const _ = require('lodash');
const Promise = require('bluebird');

//===========Redis===============
const RedisServer = require('redis-server');
const redis = require('redis');
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);
 
const server = new RedisServer(6379);
const client = redis.createClient();
//===============================

// Uncomment below to test database
// const db = require('../db/test.js');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// Serve up static html
app.use(express.static(__dirname + '/../client'));

// Routing for data generation
const dataGeneration = require('./routes/data-generation');
app.use('/dataGeneration', dataGeneration); 

//=========Check if we have all order info in our database===============
const haveAllOrderInfo = async (msg, ReceiptHandle) => {
  var message = JSON.parse(msg);
  await sqs.deleteMessage({QueueUrl: inbox, ReceiptHandle: ReceiptHandle}).promise();

  try {
    console.log('***HERE IS WHAT THE MESSAGE LOOKS LIKE***', message);
    if (message.user) {//Message is from User Activity
      console.log('Message is from User Activity');
      //Clear devices for this user
      db.clearDevices(message.user.id);
      //Save devices for this user
      await Promise.all(
        message.user.devices.map(({device_name, device_os, logged_in_at}) => db.addNewDevice(message.user.id, device_name, device_os, moment(logged_in_at).format("YYYY-MM-DD HH:mm:ss")))
      );

      //Get order id from user id
      let order_id_result = await db.getUnprocessedOrder(message.user.id);
      let order_id = order_id_result[0].id;

      //Set have devices in unprocessed order cache to true
      client.setAsync(`${order_id}:devices`, 'true');

      //Search for user's order with no fraud score
      let haveCategories = await client.existsAsync(`${order_id}:categories`);
      let haveDevices = await client.existsAsync(`${order_id}:devices`);
      if (haveCategories && haveDevices) {
        client.delAsync(`${order_id}:categories`);
        client.delAsync(`${order_id}:devices`);

        //Send unprocessed order through to analysis
        fraudAnalysis(order_id);
        

      } else {
        console.log('We do not have info from Inventory yet');
      }

    } else if (message.order_id) {//Message is from Inventory
      console.log('Message is from Inventory');

      //Generate categories
      await Promise.all(message.items.map(({category_name, category_id}) => db.addNewCategory(category_name, category_id)))
      message.items.forEach(({category_name, category_id}) => {
        //Update item where order id 
         (async () => await db.updateCategoryId(category_id, message.order_id))();
      })

      //Set have categories in unprocessed order cache to true
      client.setAsync(`${message.order_id}:categories`, 'true');
      let haveCategories = await client.existsAsync(`${message.order_id}:categories`);
      let haveDevices = await client.existsAsync(`${message.order_id}:devices`);
      if (haveCategories && haveDevices) {
        //Send unprocessed order through to analysis
        client.delAsync(`${message.order_id}:categories`);
        client.delAsync(`${message.order_id}:devices`);
        x => fraudAnalysis(message.order_id);

      } else {
        console.log('Need info from User Activity');        
      }

    } else if (message.chargedback_at || message.order) {//Message is from Orders
        console.log('Message is from Orders');
        if (message.chargedback_at) {//Update chargeback date
          // console.log('Chargeback received');
          //Update order table
          db.updateCB(message.order_id, moment(message.chargedback_at).format("YYYY-MM-DD HH:mm:ss"));
        
    } else {//Fraud analysis
      // console.log('***Analyzing for fraud***');
      //Save order to database
      db.addNewOrder(
        message.order.order_id,
        message.order.user_id, 
        message.order.billing_state, 
        message.order.billing_ZIP,
        message.order.billing_country,
        message.order.shipping_state, 
        message.order.shipping_ZIP,
        message.order.shipping_country,
        message.order.total_price,
        moment(message.order.purchased_at).format("YYYY-MM-DD HH:mm:ss"),
        message.order.std_dev_from_aov
      );
      //Save items to database
      Promise.all(message.items.map(item => db.addNewItemFromOrder(item.item_id, message.order.order_id)));

      //Send message to Users
      let usersParams = {
        MessageBody: JSON.stringify({
          user_id: message.order.user_id,
          days: 30
        }),
       QueueUrl: usersOutbox
      };

      sqs.sendMessage(usersParams).promise()
      .then(x => console.log('Sent message to users!'))
      .catch(err => console.error(err));

      //Send message to Inventory
      let invParams = {
        MessageBody: JSON.stringify({
          order_id: message.order.order_id,
          items: message.items.map(({item_id}) => item_id)
        }),
       QueueUrl: inventoryOutbox
      };

      sqs.sendMessage(invParams).promise()
      .then(x => console.log('Sent message to inventory!'))
      .catch(err => console.error(err));
      }
    } else {
      console.log('Message looks weird!');
      
    }
  } catch(e) {
    await console.error(e);
  }
};

const fraudAnalysis = async order_id => {
  try {
    //Algorithm parameters
    const algWeight = 25;
    const acceptableAOVStdDev = 2;
    const acceptableNumOfDevices = 5;
    const acceptableCategoryFraudRisk = 75;
    let fraud_score = 0;

    //*** INFO FROM ORDERS ***
    //Search for order by order ID
    let orderInfo = await db.searchOrders(order_id)
    //Grab only the first result
    let { billing_state, shipping_state, user_id, std_dev_from_aov } = orderInfo[0];
    fraud_score += billing_state === shipping_state ? 0 : algWeight;
    //Check if order total is unusually high
    if (std_dev_from_aov > 1) {
      fraud_score += std_dev_from_aov < acceptableAOVStdDev ? algWeight * (std_dev_from_aov - 1) : algWeight;
    }

    //*** INFO FROM USER ***
    //Search for a user's devices
    let deviceResult = await db.searchDevices(user_id);
    let uniqueDevices = _.uniq(deviceResult);
    // determine if # of devices is high
    fraud_score += uniqueDevices.length < acceptableNumOfDevices ? algWeight * (uniqueDevices.length / acceptableNumOfDevices) : algWeight;

    //***INFO FROM INVENTORY***
    //Determine if order has items from high-risk categories
    let itemsFromOrder = await db.getItemsFromOrder(order_id);
    let categoryIds = itemsFromOrder.map(item => item.category_id);

    //Get category fraud risk for each item
    let arrayOfCategoryFraudRisk = await Promise.all(categoryIds.map(category_id => db.getCategoryFraudRisk(category_id)));
    // console.log('arrayOfCategoryFraudRisk', arrayOfCategoryFraudRisk);
    //Sum category fraud risk scores
    let totalCategoriesFraudRisk = arrayOfCategoryFraudRisk.reduce((acc, cur) => acc + cur[0].fraud_risk, 0);

    //Increment fraud score if category risk is over acceptable category fraud risk
    fraud_score += totalCategoriesFraudRisk < acceptableCategoryFraudRisk ? algWeight * (totalCategoriesFraudRisk / acceptableCategoryFraudRisk) : algWeight; 
    console.log('FRAUD SCORE:' ,fraud_score);
    //Update fraud score for order in database
    db.updateFraudScore(user_id, fraud_score)
    .then(x => {

    //Send message to Orders with order ID and fraud score
    let ordersParams = {
      MessageBody: JSON.stringify({
        order: {
          order_id: order_id,
          fraud_score: fraud_score
        }
      }),
     QueueUrl: ordersOutbox
    };

    sqs.sendMessage(ordersParams).promise();
    })
    .catch(err => console.error(err));

  } catch(e) {
    await console.error(e);
  }
};
  
// ================== AWS ====================
// Load the AWS SDK for Node.js
const AWS = require('aws-sdk');

// Load credentials and set the region from the JSON file
AWS.config.loadFromPath('./config.json');
AWS.config.setPromisesDependency(Promise);

// SQS service objects
const sqs = new AWS.SQS({apiVersion: '2012-11-05'});

const params = {
  QueueUrl: inbox
};

let pollQueue = x => { 
  sqs.receiveMessage(params).promise()
  .then(data => {
    if (data.Messages) {
      haveAllOrderInfo(data.Messages[0].Body, data.Messages[0].ReceiptHandle);
    }
  })
  .catch(error => console.error(error));
};

setInterval(pollQueue, 50);

// ===========================================

app.listen(process.env.PORT || 3000, function() {
  console.log('listening on port 3000!');
});