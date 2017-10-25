const mysql = require('mysql');
const Promise = require('bluebird');
const cbMysql = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : ''
});

const connection = Promise.promisifyAll(cbMysql);

connection.connect();

const addNewCategory = (category) => {
  return connection.queryAsync(
    `INSERT IGNORE INTO category (name)
    VALUES ("${category}")`)
  .then((response) => {
    return response;
  })
  .catch((response) => {
    return response;
  });
}

const addNewItem = ({category_id, order_id, quantity}) => {
  return connection.queryAsync(
    `INSERT IGNORE INTO item (category_id, order_id, quantity)
    VALUES ("${category_id}", "${order_id}", "${quantity}")`)
  .then((response) => {
    return response;
  })
  .catch((response) => {
    return response;
  });
}

const addNewDevice = ({user_id, device_name, device_os, logged_in_at}) => {
  return connection.queryAsync(
    `INSERT IGNORE INTO device (user_id, device_name, device_os, logged_in_at)
    VALUES ("${user_id}", "${device_name}", "${device_os}", "${logged_in_at}")`)
  .then((response) => {
    return response;
  })
  .catch((response) => {
    return response;
  });
}

const addNewOrder = ({user_id, billing_state, billing_zip, billing_country, shipping_state, shipping_zip, shipping_country, total_price, fraud_score, purchased_at, chargedback_at, std_devs_from_aov}) => {
  return connection.queryAsync(
    `INSERT IGNORE INTO user_order (user_id, billing_state, billing_zip, billing_country, shipping_state, shipping_zip, shipping_country, total_price, fraud_score, purchased_at, chargedback_at, std_devs_from_aov)
    VALUES ("${user_id}", "${billing_state}", "${billing_zip}", "${billing_country}", "${shipping_state}", "${shipping_zip}", "${shipping_country}", "${total_price}", "${fraud_score}", "${purchased_at}", "${chargedback_at}", "${std_devs_from_aov}")`)
  .then((response) => {
    return response;
  })
  .catch((response) => {
    return response;
  });
}