/* You'll need to have MySQL running and your Node server running
 * for these tests to pass. */

const mysql = require('mysql');
const request = require('request-promise'); // You might need to npm install the request module!
const expect = require('chai').expect;
const Promise = require('bluebird');

describe('Analytics Database', function() {

  var dbConnection;

  beforeEach(function(done) {
    dbConnection = Promise.promisifyAll(
      mysql.createConnection({
        user: 'root',
        password: '',
        database: 'test'
      })
    );

    dbConnection.connect();
    
    /* Empty the db table before each test so that multiple tests
     * (or repeated runs of the tests) won't screw each other up: */
    dbConnection.queryAsync(`SET FOREIGN_KEY_CHECKS = 0`)
    .then(x => {
      return dbConnection.query(`TRUNCATE category`)
    })
    .then(x => {
      return dbConnection.query(`TRUNCATE device`)
    })
    .then(x => {
      return dbConnection.query(`TRUNCATE user_order`)
    })
    .then(x => {
      return dbConnection.query(`SET FOREIGN_KEY_CHECKS = 1`)
    })
    .then(x => {
      done()
    })
  });

  afterEach(function() {
    dbConnection.end();
  });

  it('Should generate and save categories to the DB', function(done) {
    request('http://localhost:3000/dataGeneration/categories')
    .then(x => {
      var queryString = `SELECT * FROM category`;
      dbConnection.query(queryString, function(err, results) {
        // Should have at least one result:
        expect(results.length).not.equal(0);
        done();
      });
    });
  });

  it('Should generate and save 1,000 devices to the DB', function(done) {
    request('http://localhost:3000/dataGeneration/devices')
    .then(x => {
      var queryString = `SELECT * FROM device`;
      dbConnection.query(queryString, function(err, results) {
        // Should have at least one result:
        expect(results.length).not.equal(0);
        done();
      });
    });
  });

  it('Should generate and save 100 orders to the DB', function(done) {
    request('http://localhost:3000/dataGeneration/orders')
    .then(x => {
      var queryString = `SELECT * FROM user_order`;
      dbConnection.query(queryString, function(err, results) {
        // Should have at least one result:
        expect(results.length).not.equal(0);
        done();
      });
    });
  });

  

});