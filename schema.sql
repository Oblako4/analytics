DROP DATABASE IF EXISTS analytics;

CREATE DATABASE analytics;

USE analytics;

CREATE TABLE user_order (
  id INT AUTO_INCREMENT NOT NULL,
  user_id INT NOT NULL,
  billing_state VARCHAR(50) NOT NULL,
  billing_zip VARCHAR(5) NOT NULL,
  billing_country VARCHAR(50) NOT NULL,
  shipping_state VARCHAR(50) NOT NULL,
  shipping_zip VARCHAR(5) NOT NULL,
  shipping_country VARCHAR(50) NOT NULL,
  total_price DECIMAL(7, 2),
  fraud_score INT,
  purchased_at DATETIME NOT NULL,
  chargedback_at DATETIME,
  std_devs_from_aov DECIMAL(7, 5),
  PRIMARY KEY (id)
);

CREATE TABLE category (
  id INT AUTO_INCREMENT NOT NULL,
  category_id INT NOT NULL,
  name VARCHAR(50) NOT NULL,
  fraud_risk INT,
  PRIMARY KEY (id)
);

CREATE TABLE item (
  id INT AUTO_INCREMENT NOT NULL,
  inv_id INT,
  category_id INT NOT NULL,
  order_id INT NOT NULL,
  quantity INT NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (category_id) REFERENCES category(id),
  FOREIGN KEY (order_id) REFERENCES user_order(id)
);

CREATE TABLE device (
  id INT AUTO_INCREMENT NOT NULL,
  user_id INT NOT NULL,
  device_name VARCHAR(50) NOT NULL,
  device_os VARCHAR(50) NOT NULL,
  logged_in_at DATETIME NOT NULL,
  PRIMARY KEY (id)
);