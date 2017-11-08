const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const db = require('../db/index.js');
const QueueUrl = require ('../config.js');
const _ = require('lodash');
// Uncomment below to test database
// const db = require('../db/test.js');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// Serve up static html
app.use(express.static(__dirname + '/../client'));

// Routing for data generation
var dataGeneration = require('./routes/data-generation');
app.use('/dataGeneration', dataGeneration);

app.post('/fraudAsync', async (req, res) => {
  try {
    //Algorithm parameters
    const algWeight = 25;
    const acceptableAOVStdDev = 2;
    const acceptableNumOfDevices = 5;
    const acceptableCategoryFraudRisk = 75;
    let fraud_score = 0;

    let order_id = req.body.order.order_id;

    //Search for order by order ID

    let orderInfo = await db.searchOrders(order_id)
    //Grab only the first result
    //*** INFO FROM ORDERS ***
    let { billing_name, shipping_name, billing_state, shipping_state, user_id, std_devs_from_aov } = orderInfo[0];
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

    //*** INFO FROM INVENTORY ***
    //Determine if order has items from high-risk categories

    let itemsFromOrder = await db.getItemsFromOrder(order_id);
    let categoryIds = itemsFromOrder.map(item => item.category_id);
    //Get category fraud risk for each item
    let arrayOfCategoryFraudRisk = await Promise.all(category_ids.map(category_id => db.getCategoryFraudRisk(category_id)));

    //Sum category fraud risk scores
    let totalCategoriesFraudRisk = arrayOfCategoryFraudRisk.reduce((acc, cur) => acc + cur[0].fraud_risk, 0);

    //Increment fraud score if category risk is over 30
    fraud_score += totalCategoriesFraudRisk < acceptableCategoryFraudRisk ? algWeight * (totalCategoriesFraudRisk / acceptableCategoryFraudRisk) : algWeight; 
    //Update fraud score for order in database
    await db.updateFraudScore(global_user_id, fraud_score);
    res.send(`order id: ${order_id} total fraud risk ${fraud_score}`)
  } catch(e) {
    await console.log(e);
  }
});

app.listen(3000, function() {
  console.log('listening on port 3000!');
});