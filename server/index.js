const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const db = require('../db/index.js');
const { usersInbox, usersOutbox, ordersInbox, ordersOutbox, inventoryInbox, inventoryOutbox } = require ('../config.js');
const moment = require('moment');

// Uncomment below to test database
// const db = require('../db/test.js');


app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// Serve up static html
app.use(express.static(__dirname + '/../client'));

// Routing for data generation
var dataGeneration = require('./routes/data-generation');
app.use('/dataGeneration', dataGeneration);

//=========Check if we have all order info in our database===============
const haveAllOrderInfo = async message => {
  message = JSON.parse(message);
  console.log('*** HERE IS WHAT THE MESSAGE LOOKS LIKE***', message);
  if (message.user) {//Message is from Users
    console.log('***Message is from Users***');
    //Clear devices for this user
    await db.clearDevices(message.user.id);
    //Save devices for this user
    await Promise.all(
      message.user.devices.map(({device_name, device_os, logged_in_at}) => db.addNewDevice(message.user.id, device_name, device_os, moment(logged_in_at).format("YYYY-MM-DD HH:mm:ss")))
    );
    
    //Search for user's order with no fraud score
    let unprocessedOrders = await db.getUnprocessedOrder(message.user.id);
    let unprocessedOrder = unprocessedOrders[0];
    //Check if we have categories from this user's order
    let haveCategories = await db.getItemsFromOrder(unprocessedOrder.id);
    if (haveCategories) {
      //Send unprocessed order through to analysis
      fraudAnalysis(unprocessedOrder.id);
    }

  } else if (message.order_id) {//Message is from Inventory
    console.log('***Message is from Inventory***');
    let haveCategories = await db.getCategoryFraudRisk(message.items[0].category_id);
    //Insert into the category table if the category does not exist with a random fraud score
    if (!haveCategories) {
      //Generate categories
        message.items.forEach(({category_name, category_id}) => {
           async () => await db.addNewCategory(category_name, category_id);
          //Update item where order id 
           async () => await db.updateCategoryId(category_id, message.order_id);
        })

    }
    // //Check if we have devices for this user
    let haveDevices = await db.searchDevices(message.order_id);
    if (haveDevices) {
      //Search for user's order with no fraud score
      let unprocessedOrders = await db.getUnprocessedOrder(message.user.id);
      let unprocessedOrder = unprocessedOrders[0];
      //Check if we have categories from this user's order
      let haveCategories = await db.getItemsFromOrder(unprocessedOrder.id);
      if (haveCategories) {
        //Send unprocessed order through to analysis
        fraudAnalysis(unprocessedOrder.id);
      }
    }

  } else if (message.chargedback_at || message.order) {//Message is from Orders
    console.log('***Message is from Orders***');
    if (message.chargedback_at) {//Update chargeback date
      console.log('***Chargeback received***');
      //Update order table
      await db.updateCB(message.order_id, moment(message.chargedback_at).format("YYYY-MM-DD HH:mm:ss"));
    } else {//Fraud analysis
      console.log('***Analyzing for fraud***');
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
      .then(data => console.log("Successfully sent message to Users"))
      .catch(err => console.log(err));

      //Send message to Inventory
      let invParams = {
        MessageBody: JSON.stringify({
          order_id: message.order.order_id,
          items: message.items.map(({item_id}) => item_id)
        }),
       QueueUrl: inventoryOutbox
      };

      sqs.sendMessage(invParams).promise()
      .then(data => console.log("Successfully sent message to Inventory"))
      .catch(err => console.log(err));
    }
  } else {
    console.log('Message looks weird!')
  }

};

 const fraudAnalysis = async order_id => {
  try {
    //Algorithm parameters
    const algWeight = 25;
    const acceptableAOVStdDev = 3;
    const acceptableNumOfDevices = 6;

    let fraud_score = 0;
    // let order_id = req.body.order.order_id;
    // const items = req.body.items;

    //Search for order by order ID

    let orderInfo = await db.searchOrders(order_id)
    //Grab only the first result
    //*** INFO FROM ORDERS ***
    let { billing_name, shipping_name, billing_state, shipping_state, user_id, std_dev_from_aov } = orderInfo[0];
    fraud_score += billing_state === shipping_state ? 0 : algWeight;
    //Check if order total is unusually high
    fraud_score += std_dev_from_aov < acceptableAOVStdDev ? 0 : algWeight;

    //*** INFO FROM USER ***
    //Search for a user's devices
    let deviceResult = await db.searchDevices(user_id);
    // determine if # of devices is high
    fraud_score += deviceResult.length < acceptableNumOfDevices ? 0 : algWeight;

    //*** INFO FROM INVENTORY ***
    //Determine if order has items from high-risk categories

    //Get category id for each item in order
    // Promise.all(items.map(({item_id}) => db.searchItems(item_id))))

    //Until we receive items as part of order info...
    let itemsFromOrder = await db.getItemsFromOrder(order_id);
    let categoryIds = itemsFromOrder.map(item => item.category_id);
    //Get category fraud risk for each item
    let arrayOfCategoryFraudRisk = await Promise.all(categoryIds.map(category_id => db.getCategoryFraudRisk(category_id)));

    //Sum category fraud risk scores
    let totalCategoriesFraudRisk = arrayOfCategoryFraudRisk.reduce((acc, cur) => acc + cur[0].fraud_risk, 0);

    //Increment fraud score if category risk is over 30
    fraud_score += totalCategoriesFraudRisk < 80 ? 0 : algWeight; 
    console.log('***FRAUD SCORE***' ,fraud_score);
    //Update fraud score for order in database
    // db.updateFraudScore(user_id, fraud_score);

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
      .then(data => console.log("Successfully sent message to Orders"))
      .catch(err => console.log(err));


  } catch(e) {
    await console.log(e);
  }
};
  
// ================== AWS ====================
// Load the AWS SDK for Node.js
const Consumer = require('sqs-consumer');
const AWS = require('aws-sdk');

// Load credentials and set the region from the JSON file
AWS.config.loadFromPath('./config.json');

// SQS service objects
const sqs = new AWS.SQS({apiVersion: '2012-11-05'}); //For sending
const sqsOrders = new AWS.SQS({apiVersion: '2012-11-05'});
const sqsUsers = new AWS.SQS({apiVersion: '2012-11-05'});
const sqsInventory = new AWS.SQS({apiVersion: '2012-11-05'});

//Polling for messages

//Orders
const sqsConsumerOrders = Consumer.create({
  queueUrl: ordersInbox,
  handleMessage: (message, done) => {
    console.log('***MESSAGE FROM ORDERS', message);
    haveAllOrderInfo(message.Body);
    done();
  },
  sqs: sqsOrders
});

//Users
const sqsConsumerUsers = Consumer.create({
  queueUrl: usersInbox,
  handleMessage: (message, done) => {
    haveAllOrderInfo(message.Body);
    done();
  },
  sqs: sqsUsers
});

//Inventory
const sqsConsumerInventory = Consumer.create({
  queueUrl: inventoryInbox,
  handleMessage: (message, done) => {
    haveAllOrderInfo(message.Body);
    done();
  },
  sqs: sqsInventory
});
 
sqsConsumerOrders.on('error', (err) => {
  console.log(err.message);
});
 
sqsConsumerOrders.start();

sqsConsumerUsers.on('error', (err) => {
  console.log(err.message);
});
 
sqsConsumerUsers.start();

sqsConsumerInventory.on('error', (err) => {
  console.log(err.message);
});
 
sqsConsumerInventory.start();


// ===========================================

app.listen(3000, function() {
  console.log('listening on port 3000!');
});