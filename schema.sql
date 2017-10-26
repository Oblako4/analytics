DROP DATABASE IF EXISTS analytics;

CREATE DATABASE analytics;

USE analytics;

CREATE TABLE user_order (
  id INT NOT NULL,
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
  id INT NOT NULL,
  name VARCHAR(50) NOT NULL,
  fraud_risk INT,
  PRIMARY KEY (id)
);

CREATE TABLE item (
  id INT NOT NULL,
  category_id INT NOT NULL,
  order_id INT NOT NULL,
  quantity INT,
  PRIMARY KEY (id),
  FOREIGN KEY (category_id) REFERENCES category(id),
  FOREIGN KEY (order_id) REFERENCES user_order(id)
);

CREATE TABLE device (
  id INT AUTO_INCREMENT NOT NULL,
  user_id INT NOT NULL,
  device_name VARCHAR(50),
  device_os VARCHAR(50),
  logged_in_at DATETIME,
  PRIMARY KEY (id)
);


INSERT INTO user_order (id, user_id, billing_state, shipping_state, std_devs_from_aov) VALUES (354, 1, 'CA', 'MI', 3);
INSERT INTO category (id, name, fraud_risk) VALUES (21, 'category1', 20);
INSERT INTO category (id, name, fraud_risk) VALUES (1, 'category2', 20);
INSERT INTO item (id, order_id, category_id) VALUES (122, 354, 21);
INSERT INTO item (id, order_id, category_id) VALUES (456, 354, 1);
INSERT INTO device (user_id) VALUES (1);
