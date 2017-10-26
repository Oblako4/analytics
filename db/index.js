const mysql = require('mysql');
const Promise = require('bluebird');
const cbMysql = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database: 'analytics'
});

const connection = Promise.promisifyAll(cbMysql);

connection.connect();

const addNewCategory = (category, id) => {
  return connection.queryAsync(
    `INSERT IGNORE INTO category (name, id)
    VALUES ("${category}", "${id}")`)
  .then(response => {
    return response;
  })
  .catch(response => {
    return response;
  });
}

const addNewItemFromOrder = (id, category_id, order_id, quantity) => {
  return connection.queryAsync(
    `INSERT IGNORE INTO item (id, category_id, order_id, quantity) 
    VALUES ("${id}", "${category_id}", "${order_id}", "${quantity}")`)
  .then((response) => {
    return response;
  })
  .catch((response) => {
    return response;
  });
}

const addNewDevice = (user_id, device_name, device_os, logged_in_at) => {
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

const addNewOrder = (
   id, 
   user_id, 
   billing_state, 
   billing_zip,
   billing_country,
   shipping_state, 
   shipping_zip,
   shipping_country,
   total_price,
   purchased_at,
   std_devs_from_aov
  ) => {
  return connection.queryAsync(
    `INSERT IGNORE INTO user_order (
      id, 
      user_id, 
      billing_state, 
      billing_zip, 
      billing_country, 
      shipping_state, 
      shipping_zip, 
      shipping_country, 
      total_price,  
      purchased_at, 
      std_devs_from_aov)
    VALUES (
      "${id}", 
      "${user_id}", 
      "${billing_state}", 
      "${billing_zip}", 
      "${billing_country}", 
      "${shipping_state}", 
      "${shipping_zip}", 
      "${shipping_country}", 
      "${total_price}", 
      "${purchased_at}", 
      "${std_devs_from_aov}")`
    )
  .then(response => {
    console.log(response);
    return response;
  })
  .catch(response => {
    console.log(response);
    return response;
  });
}

module.exports = {
  addNewCategory,
  addNewOrder,
  addNewItemFromOrder,
  addNewDevice
}