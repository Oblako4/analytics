DROP DATABASE IF EXISTS analytics;

CREATE DATABASE analytics;

USE analytics;

CREATE TABLE user_order (
  id INT,
  user_id INT,
  billing_state VARCHAR(50),
  billing_ZIP VARCHAR(20),
  billing_country VARCHAR(50),
  shipping_state VARCHAR(50),
  shipping_ZIP VARCHAR(20),
  shipping_country VARCHAR(50),
  total_price DECIMAL(7, 2),
  fraud_score INT,
  purchased_at DATETIME,
  chargedback_at DATETIME,
  std_dev_from_aov DECIMAL(7, 5),
  PRIMARY KEY (id)
);

CREATE TABLE category (
  id INT,
  name VARCHAR(200),
  fraud_risk INT,
  PRIMARY KEY (id)
);

CREATE TABLE item (
  id INT,
  category_id INT,
  order_id INT
);

CREATE TABLE device (
  user_id INT NOT NULL,
  device_name VARCHAR(100),
  device_os VARCHAR(100),
  logged_in_at DATETIME
);


