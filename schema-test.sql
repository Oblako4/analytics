DROP DATABASE IF EXISTS test;

CREATE DATABASE test;

USE test;

CREATE TABLE user_order (
  id INT AUTO_INCREMENT NOT NULL,
  user_id INT NOT NULL,
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
  id INT AUTO_INCREMENT NOT NULL,
  name VARCHAR(50) NOT NULL,
  fraud_risk INT,
  PRIMARY KEY (id)
);

CREATE TABLE item (
  id INT AUTO_INCREMENT NOT NULL,
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


