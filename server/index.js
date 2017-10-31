const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const db = require('../db/index.js');
// Uncomment below to test database
// const db = require('../db/test.js');

// ***** AWS *****
// Load the AWS SDK for Node.js
const AWS = require('aws-sdk');

// Load credentials and set the region from the JSON file
AWS.config.loadFromPath('./config.json');

// SQS service object
const sqs = new AWS.SQS({apiVersion: '2012-11-05'});
const QueueUrl = "https://sqs.us-west-1.amazonaws.com/810323078514/oblako-analytics";
// ***************

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// Serve up static html
app.use(express.static(__dirname + '/../client'));

// Routing for data generation
var dataGeneration = require('./routes/data-generation');
app.use('/dataGeneration', dataGeneration);

app.get('/sendmessage', (req, res) => {
  // Sending a message
  var params = {
   MessageBody: "This is a test message. Hello!!!",
   QueueUrl: QueueUrl
  };

  sqs.sendMessage(params).promise()
  .then(data => console.log("Success", data.MessageId))
  .then(x => res.send('success'))
  .catch(err => console.log(err));
})

app.get('/receiveMessage', (req, res) => {
  // Sending a message
  var params = {
   QueueUrl: QueueUrl
  };

  return sqs.receiveMessage(params).promise()
  .then(data => {
    console.log(data);
    var deleteParams = {
      QueueUrl: QueueUrl,
      ReceiptHandle: data.Messages[0].ReceiptHandle
    };

    return sqs.deleteMessage(deleteParams).promise()
  })
  .then(x => {
    console.log('xxxxxx', x);
    res.send('message received and deleted from queue!');
  })
  .catch(err => console.log(err));
})


app.post('/fraud', (req, res) => {
  //Algorithm parameters
  const algWeight = 25;
  const acceptableAOVStdDev = 3;
  const acceptableNumOfDevices = 6;

  let fraud_score = 0;
  let order_id = req.body.order.order_id;
  // let order_id = ;
  let global_user_id;
  // const items = req.body.items;

  //Search for order by order ID
  return db.searchOrders(order_id)
  //Grab only the first result
  .then(orderResult => orderResult[0])

  //*** INFO FROM ORDERS ***
  .then(({billing_name, shipping_name, billing_state, shipping_state, user_id, std_devs_from_aov}) => {
    //compare billing and shipping state
    fraud_score += billing_state === shipping_state ? 0 : algWeight;
    //Check if order total is unusually high
    fraud_score += std_devs_from_aov < acceptableAOVStdDev ? 0 : algWeight;
    global_user_id = user_id;
    return user_id;
  })

  //*** INFO FROM USER ***
  //Search for a user's devices
  .then(user_id => db.searchDevices(user_id))
  // determine if # of devices is high
  .then(deviceResult => fraud_score += deviceResult.length < acceptableNumOfDevices ? 0 : algWeight)

  //*** INFO FROM INVENTORY ***
  //Determine if order has items from high-risk categories
  .then( x => 
    //Get category id for each item in order
    // Promise.all(items.map(({item_id}) => db.searchItems(item_id))))

    //Until we receive items as part of order info...
    db.getItemsFromOrder(order_id))
  .then( result => result.map(item => item.category_id))
  //Get category fraud risk for each item
  // .then(category_ids => Promise.all(category_ids[0].map(({category_id}) => db.getCategoryFraudRisk(category_id))))
  .then(category_ids => Promise.all(category_ids.map((category_id) => db.getCategoryFraudRisk(category_id))))

  //Sum category fraud risk scores
  .then(arrayOfCategoryFraudRisk => arrayOfCategoryFraudRisk.reduce((acc, cur) => acc + cur[0].fraud_risk, 0))
  .then(totalCategoriesFraudRisk => {
    //Increment fraud score if category risk is over 30
    fraud_score += totalCategoriesFraudRisk < 80 ? 0 : algWeight; 
    //Update fraud score for order in database
    db.updateFraudScore(global_user_id, fraud_score);
    res.send(`order id: ${order_id} total fraud risk ${fraud_score}`)
  })
  .catch(err => console.log(err))
});

app.listen(3000, function() {
  console.log('listening on port 3000!');
});