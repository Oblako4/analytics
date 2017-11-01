const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const db = require('../db/index.js');
const queueUrl = require ('../config.js');
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
  if (message.user) {//Message is from Users
    //Check if we have devices for this user
    let haveDevices = await db.searchDevices(message.user.id);
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
  } else if (message.items) {
    //message is from Inventory
    //TODO
  } else {
    //message is from Orders
    //TODO
    console.log(message);
  }

  // let orderInfoCheck = await db.searchOrders(order_id);
  // let user_idCheck = orderInfoCheck[0].user_id;
  // let deviceResultCheck = await db.searchDevices(user_idCheck);
  // let itemsFromOrderCheck = await db.getItemsFromOrder(order_id);
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
    let { billing_name, shipping_name, billing_state, shipping_state, user_id, std_devs_from_aov } = orderInfo[0];
    fraud_score += billing_state === shipping_state ? 0 : algWeight;
    //Check if order total is unusually high
    fraud_score += std_devs_from_aov < acceptableAOVStdDev ? 0 : algWeight;

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
    //TODO
    // res.send(`order id: ${order_id} total fraud risk ${fraud_score}`)
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

// SQS service object
const sqs = new AWS.SQS({apiVersion: '2012-11-05'});

//Polling for messages from Orders
const sqsConsumer = Consumer.create({
  queueUrl: queueUrl,
  handleMessage: (message, done) => {
    haveAllOrderInfo(message.Body);
    done();
  },
  sqs: sqs
});
 
sqsConsumer.on('error', (err) => {
  console.log(err.message);
});
 
sqsConsumer.start();


// ===========================================

app.get('/sendmessage', (req, res) => {
  // Sending a message
  var params = {
    MessageBody: JSON.stringify({
      user: {
        id: 7134
      }
    }),
   QueueUrl: queueUrl
  };

  sqs.sendMessage(params).promise()
  .then(data => console.log("Success", data.MessageId))
  .then(x => res.send('success'))
  .catch(err => console.log(err));
});

app.listen(3000, function() {
  console.log('listening on port 3000!');
});