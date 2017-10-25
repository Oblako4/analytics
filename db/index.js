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