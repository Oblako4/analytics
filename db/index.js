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

const addNewCategory = (category, id, fraud_risk) => {
  return connection.queryAsync(
    `INSERT IGNORE INTO category (name, id, fraud_risk)
    VALUES ("${category}", "${id}", "${fraud_risk}")`)
  .then(response => {
    return response;
  })
  .catch(response => {
    return response;
  });
}

const addNewItemFromOrder = (category_id, order_id, quantity) => {
  return connection.queryAsync(
    `INSERT IGNORE INTO item (category_id, order_id, quantity) 
    VALUES ("${category_id}", "${order_id}","${quantity}")`)
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
    // console.log(response);
    return response;
  })
  .catch(response => {
    // console.log(response);
    return response;
  });
}

const searchOrders = id => {
  return connection.queryAsync(`SELECT * FROM user_order WHERE id = "${id}"`)
  .then(response => {
    return response;
  })
  .catch(response => {
    return response;
  });
}

const getItemsFromOrder = id => {
  return connection.queryAsync(`SELECT category_id FROM item WHERE order_id = "${id}"`)
  .then(response => {
    return response;
  })
  .catch(response => {
    return response;
  });
}

const searchDevices = user_id => {
  return connection.queryAsync(`SELECT * FROM device WHERE user_id = "${user_id}"`)
  .then(response => {
    return response;
  })
  .catch(response => {
    return response;
  });
}

const searchItems = item_id => {
  return connection.queryAsync(`SELECT category_id FROM item WHERE id = "${item_id}"`)
  .then(response => {
    return response;
  })
  .catch(response => {
    return response;
  });
}

const getCategoryFraudRisk = category_id => {
  return connection.queryAsync(`SELECT fraud_risk FROM category WHERE id = "${category_id}"`)
  .then(response => {
    return response;
  })
  .catch(response => {
    return response;
  });
}

const updateFraudScore = (user_id, fraud_score) => {
  return connection.queryAsync(`UPDATE user_order SET fraud_score = "${fraud_score}" WHERE user_id = "${user_id}"`)
  .then(response => {
    return response;
  })
  .catch(response => {
    return response;
  });
}

module.exports = {
  addNewCategory,
  addNewOrder,
  addNewItemFromOrder,
  addNewDevice,
  searchOrders,
  searchDevices,
  searchItems,
  getCategoryFraudRisk,
  updateFraudScore,
  getItemsFromOrder
}