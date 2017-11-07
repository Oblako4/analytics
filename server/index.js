const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const db = require('../db/index.js');
const moment = require('moment');
const { inbox, usersOutbox, ordersOutbox, inventoryOutbox } = require ('../config.js');
const _ = require('lodash');
const Promise = require('bluebird');

// Uncomment below to test database
// const db = require('../db/test.js');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// Serve up static html
app.use(express.static(__dirname + '/../client'));

// Routing for data generation
const dataGeneration = require('./routes/data-generation');
app.use('/dataGeneration', dataGeneration);


let redisLite = {
  //If it isn't here, query db
}; 

//=========Check if we have all order info in our database===============
const haveAllOrderInfo = async (message, ReceiptHandle) => {
  try {
    message = JSON.parse(message);
    console.log('***HERE IS WHAT THE MESSAGE LOOKS LIKE***', message);
    if (message.user) {//Message is from User Activity
      console.log('***Message is from User Activity***');
      //Clear devices for this user
      await db.clearDevices(message.user.id);
      //Save devices for this user
      await Promise.all(
        message.user.devices.map(({device_name, device_os, logged_in_at}) => db.addNewDevice(message.user.id, device_name, device_os, moment(logged_in_at).format("YYYY-MM-DD HH:mm:ss")))
      );

      let order_id_result = await db.getUnprocessedOrder(message.user.id);
      let order_id = order_id_result[0].id;

      //Set have devices in unprocessed order cache to true
      redisLite[order_id] = redisLite[order_id] || {};
      redisLite[order_id].haveDevices = true;

      // if (haveItems.length > 0) {
        //Search for user's order with no fraud score
      if (redisLite[order_id].haveDevices && redisLite[order_id].haveCategories) {
        //Send unprocessed order through to analysis
        delete redisLite[order_id];
        fraudAnalysis(order_id);
      } else {
        console.log('We do not have info from Inventory yet');
        sqs.deleteMessage({QueueUrl: inbox, ReceiptHandle});
      }

    } else if (message.order_id) {//Message is from Inventory
      console.log('***Message is from Inventory***');

      //Generate categories
      await Promise.all(message.items.map(({category_name, category_id}) => db.addNewCategory(category_name, category_id)))
      message.items.forEach(({category_name, category_id}) => {
        //Update item where order id 
         (async () => await db.updateCategoryId(category_id, message.order_id))();
      })

      //Set have categories in unprocessed order cache to true
      redisLite[message.order_id] = redisLite[message.order_id] || {};
      redisLite[message.order_id].haveCategories = true;

      if (redisLite[message.order_id].haveDevices && redisLite[message.order_id].haveCategories) {
          //Send unprocessed order through to analysis
          delete redisLite[message.order_id];
          fraudAnalysis(message.order_id);
      } else {
        console.log('Need info from User Activity');
        sqs.deleteMessage({QueueUrl: inbox, ReceiptHandle});
      }

    } else if (message.chargedback_at || message.order) {//Message is from Orders
      console.log('***Message is from Orders***');
      if (message.chargedback_at) {//Update chargeback date
        console.log('***Chargeback received***');
        //Update order table
        await db.updateCB(message.order_id, moment(message.chargedback_at).format("YYYY-MM-DD HH:mm:ss"));
        sqs.deleteMessage({QueueUrl: inbox, ReceiptHandle});
      } else {//Fraud analysis
        // console.log('***Analyzing for fraud***');
        //Save order to database
        await db.addNewOrder(
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
        await Promise.all(message.items.map(item => db.addNewItemFromOrder(item.item_id, message.order.order_id)))

        //Send message to Users
        let usersParams = {
          MessageBody: JSON.stringify({
            user_id: message.order.user_id,
            days: 30
          }),
         QueueUrl: usersOutbox
        };

        sqs.sendMessage(usersParams).promise()
        .then(data => console.log("Successfully sent message to User Activity")})
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
        .then(data => {
          console.log("Successfully sent message to Inventory");
          sqs.deleteMessage({QueueUrl: inbox, ReceiptHandle});
        })
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
    const acceptableAOVStdDev = 7;
    const acceptableNumOfDevices = 6;
    let fraud_score = 0;

    //*** INFO FROM ORDERS ***
    //Search for order by order ID
    let orderInfo = await db.searchOrders(order_id)
    //Grab only the first result
    let { billing_state, shipping_state, user_id, std_dev_from_aov } = orderInfo[0];
    fraud_score += billing_state === shipping_state ? 0 : algWeight;
    //Check if order total is unusually high
    fraud_score += std_dev_from_aov < acceptableAOVStdDev ? 0 : algWeight;

    //*** INFO FROM USER ***
    //Search for a user's devices
    let deviceResult = await db.searchDevices(user_id);
    let uniqueDevices = _.uniq(uniqueDevices);
    // determine if # of devices is high
    fraud_score += uniqueDevices.length < acceptableNumOfDevices ? 0 : algWeight;

    //*** INFO FROM INVENTORY ***
    //Determine if order has items from high-risk categories
    let itemsFromOrder = await db.getItemsFromOrder(order_id);
    // console.log("itemsFromOrder", itemsFromOrder);
    let categoryIds = itemsFromOrder.map(item => item.category_id);
    // console.log('categoryIds', categoryIds);
    //Get category fraud risk for each item
    let arrayOfCategoryFraudRisk = await Promise.all(categoryIds.map(category_id => db.getCategoryFraudRisk(category_id)));
    // console.log('arrayOfCategoryFraudRisk', arrayOfCategoryFraudRisk);
    //Sum category fraud risk scores
    let totalCategoriesFraudRisk = arrayOfCategoryFraudRisk.reduce((acc, cur) => acc + cur[0].fraud_risk, 0);

    //Increment fraud score if category risk is over 30
    fraud_score += totalCategoriesFraudRisk < 80 ? 0 : algWeight; 
    console.log('***FRAUD SCORE***' ,fraud_score);
    //Update fraud score for order in database
    await db.updateFraudScore(user_id, fraud_score);
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

    sqs.sendMessage(ordersParams).promise()
    .then(data => {
      console.log("Successfully sent message to Orders");
      sqs.deleteMessage({QueueUrl: inbox, ReceiptHandle});
    })
    .catch(err => console.log(err));

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
const sqs = new AWS.SQS({apiVersion: '2012-11-05'}); //For sending
const sqsInbox = new AWS.SQS({apiVersion: '2012-11-05'});

const params = {
  QueueUrl: inbox
};

let pollQueue = x => { 
  sqs.receiveMessage(params).promise()
  .then(message => haveAllOrderInfo(message.Body, message.Messages[0]))
  .catch(error => console.error(error));
};

setInterval(pollQueue, 10);

// ===========================================

app.listen(process.env.PORT || 3000, function() {
  console.log('listening on port 3000!');
});