DROP DATABASE IF EXISTS analytics;

CREATE DATABASE analytics;

USE analytics;

CREATE TABLE user_order (
  primaryId INT AUTO_INCREMENT,
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
  PRIMARY KEY (primaryId)
);

CREATE TABLE category (
  primaryId INT AUTO_INCREMENT,
  id INT,
  name VARCHAR(200),
  fraud_risk INT,
  PRIMARY KEY (primaryId)
);

CREATE TABLE item (
  primaryId INT AUTO_INCREMENT,  
  id INT NOT NULL,
  category_id INT,
  order_id INT,
  PRIMARY KEY (primaryId)
);

CREATE TABLE device (
  id INT AUTO_INCREMENT,
  user_id INT,
  device_name VARCHAR(100),
  device_os VARCHAR(100),
  logged_in_at DATETIME,
  PRIMARY KEY (id)
);


