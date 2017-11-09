DROP DATABASE IF EXISTS analytics;

CREATE DATABASE analytics;

USE analytics;

CREATE TABLE user_order (
  id INT,
  user_id INT NOT NULL,
  billing_state VARCHAR(50) NOT NULL,
  billing_ZIP VARCHAR(20) NOT NULL,
  billing_country VARCHAR(50) NOT NULL,
  shipping_state VARCHAR(50) NOT NULL,
  shipping_ZIP VARCHAR(20) NOT NULL,
  shipping_country VARCHAR(50) NOT NULL,
  total_price DECIMAL(7, 2) NOT NULL,
  fraud_score INT,
  purchased_at DATETIME NOT NULL,
  chargedback_at DATETIME,
  std_dev_from_aov DECIMAL(7, 5) NOT NULL,
  PRIMARY KEY (id),
  INDEX (fraud_score)
);

CREATE TABLE category (
  id INT,
  name VARCHAR(200) NOT NULL,
  fraud_risk INT NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE item (
  id INT,
  category_id INT,
  order_id INT NOT NULL,
  INDEX (category_id),
  INDEX (order_id)
);

CREATE TABLE device (
  user_id INT NOT NULL,
  device_name VARCHAR(100) NOT NULL,
  device_os VARCHAR(100) NOT NULL,
  logged_in_at DATETIME NOT NULL,
  INDEX (user_id)
);


