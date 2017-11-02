DROP DATABASE IF EXISTS analytics;

CREATE DATABASE analytics;

USE analytics;

CREATE TABLE user_order (
  id INT,
  user_id INT,
  billing_state VARCHAR(50),
  billing_zip VARCHAR(5),
  billing_country VARCHAR(50),
  shipping_state VARCHAR(50),
  shipping_zip VARCHAR(5),
  shipping_country VARCHAR(50),
  total_price DECIMAL(7, 2),
  fraud_score INT,
  purchased_at DATETIME,
  chargedback_at DATETIME,
  std_devs_from_aov DECIMAL(7, 5),
  PRIMARY KEY (id)
);

CREATE TABLE category (
  id INT,
  name VARCHAR(200),
  fraud_risk INT,
  PRIMARY KEY (id)
);

CREATE TABLE item (
  id INT NOT NULL,
  category_id INT,
  order_id INT,
  PRIMARY KEY (id)
);

CREATE TABLE device (
  id INT AUTO_INCREMENT,
  user_id INT,
  device_name VARCHAR(100),
  device_os VARCHAR(100),
  logged_in_at DATETIME,
  PRIMARY KEY (id)
);


