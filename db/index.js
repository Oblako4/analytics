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

const addNewCategory = (name, id) => {
  return connection.queryAsync(
    `INSERT IGNORE INTO category (name, id, fraud_risk)
    VALUES ("${name}", "${id}", "${Math.floor(Math.random() * 100)}")`)
  .then(response => {
    return response;
  })
  .catch(response => {
    return response;
  });
}

const addNewItemFromOrder = (id, order_id) => {
  return connection.queryAsync(
    `INSERT IGNORE INTO item (id, order_id) 
    VALUES ("${id}", "${order_id}")`)
  .then((response) => {
    return response;
  })
  .catch((response) => {
    return response;
  });
}

const clearDevices = user_id => {
  return connection.queryAsync(`DELETE FROM device WHERE user_id = "${user_id}"`)
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
  billing_ZIP,
  billing_country,
  shipping_state, 
  shipping_ZIP,
  shipping_country,
  total_price,
  purchased_at,
  std_dev_from_aov
  ) => {
  return connection.queryAsync(
    `INSERT IGNORE INTO user_order (
      id,
      user_id, 
      billing_state, 
      billing_ZIP, 
      billing_country, 
      shipping_state, 
      shipping_ZIP, 
      shipping_country, 
      total_price,  
      purchased_at, 
      std_dev_from_aov)
    VALUES (
      "${id}", 
      "${user_id}", 
      "${billing_state}", 
      "${billing_ZIP}", 
      "${billing_country}", 
      "${shipping_state}", 
      "${shipping_ZIP}", 
      "${shipping_country}", 
      "${total_price}", 
      "${purchased_at}", 
      "${std_dev_from_aov}")`
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

const getUserFromOrder = order_id => {
  return connection.queryAsync(`SELECT user_id FROM user_order WHERE id = "${order_id}"`)
  .then(response => {
    return response;
  })
  .catch(response => {
    return response;
  });
}

const getUnprocessedOrder = user_id => {
  return connection.queryAsync(`SELECT * FROM user_order WHERE user_id = "${user_id}"`)
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

const searchUserItems = user_id => {
  return connection.queryAsync(`SELECT item.id FROM item INNER JOIN user_order ON item.order_id = user_order.id WHERE user_order.user_id = "${user_id}"`)
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

const updateCB = (id, chargedback_at) => {
  return connection.queryAsync(`UPDATE user_order SET chargedback_at = "${chargedback_at}" WHERE id = "${id}"`)
  .then(response => {
    return response;
  })
  .catch(response => {
    return response;
  });
}

const updateCategoryId = (category_id, order_id) => {
  return connection.queryAsync(`UPDATE item SET category_id = "${category_id}" WHERE order_id = "${order_id}"`)
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
  getItemsFromOrder,
  getUnprocessedOrder,
  clearDevices,
  updateCB,
  updateCategoryId,
  searchUserItems,
  getUserFromOrder
}