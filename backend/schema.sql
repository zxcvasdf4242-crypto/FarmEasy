CREATE DATABASE IF NOT EXISTS farmer_portal;
USE farmer_portal;

CREATE TABLE farmers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  state VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE crops (
  id INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  quantity_kg INT NOT NULL,
  price_per_kg DECIMAL(10,2) NOT NULL,
  location VARCHAR(100),
  status ENUM('available','reserved','sold') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
);

CREATE TABLE contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  crop_id INT NOT NULL,
  buyer_name VARCHAR(100),
  buyer_phone VARCHAR(20),
  buyer_email VARCHAR(150),
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE
);

CREATE TABLE states_languages (
  state VARCHAR(100) PRIMARY KEY,
  language_code VARCHAR(10) NOT NULL
);

INSERT INTO states_languages (state, language_code) VALUES
('Maharashtra','mr'),
('Karnataka','kn'),
('Tamil Nadu','ta'),
('Telangana','te'),
('Andhra Pradesh','te'),
('Kerala','ml'),
('Gujarat','gu'),
('Punjab','pa'),
('West Bengal','bn'),
('Bihar','hi')
ON DUPLICATE KEY UPDATE language_code=VALUES(language_code);
