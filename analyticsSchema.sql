DROP DATABASE IF EXISTS fraudAnalytics;

CREATE DATABASE fraudAnalytics;

CREATE TABLE order (
  id INT NOT NULL,
  user_id INT NOT NULL,
  billing_state VARCHAR(200) NOT NULL,
  billing_zip INT NOT NULL,
  billing_country VARCHAR(200) NOT NULL,
  shipping_state VARCHAR(200) NOT NULL,
  shipping_zip INT NOT NULL,
  shipping_country VARCHAR(200) NOT NULL,
  total_price DECIMAL(65, 2),
  fraud_score DECIMAL(65, 2),
  purchased_at DATETIME NOT NULL,
  chargedback_at DATETIME,
  std_devs_from_aov DECIMAL(65, 2),
  PRIMARY KEY (id)
);

CREATE TABLE item (
  id INT NOT NULL,
  inv_id INT,
  category_id INT NOT NULL,
  order_id INT NOT NULL,
  quantity INT NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE category (
  id INT NOT NULL,
  category_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  fraud_risk DECIMAL(65, 2),
  PRIMARY KEY (id)
);

CREATE TABLE device (
  id INT NOT NULL,
  user_id INT NOT NULL,
  device_name VARCHAR(200) NOT NULL,
  device_os VARCHAR(200) NOT NULL,
  logged_in_at DATETIME NOT NULL,
  PRIMARY KEY (id)
);