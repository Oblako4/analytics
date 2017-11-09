const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const db = require('../db/index.js');
const moment = require('moment');
const { inbox, usersOutbox, ordersOutbox, inventoryOutbox } = require ('../config.js');
const _ = require('lodash');
const Promise = require('bluebird');
const RedisServer = require('redis-server');

//===========Redis===============
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

const fraudAnalysis = async order_id => {
  try {
    //Redis setup
    client.setAsync(`${order_id}:devices`, 'true');
    client.setAsync(`${message.order_id}:categories`, 'true');
    let haveCategories = await client.existsAsync(`${order_id}:categories`);
    let haveDevices = await client.existsAsync(`${order_id}:devices`);

    if (haveCategories && haveDevices) {
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
      console.log('***FRAUD SCORE***' ,fraud_score);
      //Update fraud score for order in database
      await db.updateFraudScore(user_id, fraud_score);
      //Send message to Orders with order ID and fraud score}
  } catch(e) {
    await console.error(e);
  }
};

app.listen(process.env.PORT || 3000, function() {
  console.log('listening on port 3000!');
});