CREATE DATABASE IF NOT EXISTS resq_ko_mahal_ko CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE resq_ko_mahal_ko;

CREATE TABLE IF NOT EXISTS users (
 id INT AUTO_INCREMENT PRIMARY KEY,
 full_name VARCHAR(150) NOT NULL,
 email VARCHAR(190) NOT NULL UNIQUE,
 phone VARCHAR(30) NOT NULL,
 address VARCHAR(255) NOT NULL,
 password VARCHAR(255) NOT NULL,
 role ENUM('user','admin') NOT NULL DEFAULT 'user',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 INDEX idx_users_role(role)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS healthcare_facilities (
 id INT AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(180) NOT NULL,
 facility_type ENUM('Hospital','Clinic','Pharmacy','Health Center','Emergency') NOT NULL,
 address VARCHAR(255) NOT NULL,
 barangay VARCHAR(120),
 phone VARCHAR(40),
 operating_hours VARCHAR(180),
 latitude DECIMAL(10,7),
 longitude DECIMAL(10,7),
 services TEXT,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 INDEX idx_health_type(facility_type), INDEX idx_health_barangay(barangay)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS evacuation_centers (
 id INT AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(180) NOT NULL,
 address VARCHAR(255) NOT NULL,
 barangay VARCHAR(120),
 facilities TEXT,
 contact_number VARCHAR(40),
 capacity INT,
 current_status ENUM('Available','Near Full','Full','Closed','Unknown') DEFAULT 'Unknown',
 latitude DECIMAL(10,7), longitude DECIMAL(10,7),
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 INDEX idx_evac_status(current_status), INDEX idx_evac_barangay(barangay)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS disaster_warnings (
 id INT AUTO_INCREMENT PRIMARY KEY,
 title VARCHAR(180) NOT NULL,
 description TEXT NOT NULL,
 hazard_type ENUM('Typhoon','Flood','Rainfall','Earthquake','Landslide','Other') NOT NULL,
 severity ENUM('Low','Moderate','High','Critical') NOT NULL,
 status ENUM('Active','Monitoring','Expired','Cancelled') DEFAULT 'Monitoring',
 source_name VARCHAR(120), source_url VARCHAR(500),
 area_name VARCHAR(180) NOT NULL,
 starts_at DATETIME, ends_at DATETIME, last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
 created_by INT,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL,
 INDEX idx_warning_status(status), INDEX idx_warning_severity(severity), INDEX idx_warning_area(area_name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS affected_areas (
 id INT AUTO_INCREMENT PRIMARY KEY,
 warning_id INT NOT NULL,
 area_name VARCHAR(180) NOT NULL,
 barangay VARCHAR(120),
 hazard_level ENUM('Low','Moderate','High') NOT NULL,
 boundary_geojson JSON NULL,
 FOREIGN KEY(warning_id) REFERENCES disaster_warnings(id) ON DELETE CASCADE,
 INDEX idx_affected_barangay(barangay), INDEX idx_hazard_level(hazard_level)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS incident_reports (
 id INT AUTO_INCREMENT PRIMARY KEY,
 user_id INT NOT NULL,
 title VARCHAR(180) NOT NULL,
 description TEXT NOT NULL,
 category VARCHAR(80) NOT NULL,
 location VARCHAR(255) NOT NULL,
 barangay VARCHAR(120),
 incident_at DATETIME,
 status ENUM('Pending','Unverified - Evidence Pending','Under Review','Verified','Rejected','Resolved') DEFAULT 'Pending',
 rejection_reason TEXT,
 reviewed_by INT NULL,
 reviewed_at DATETIME NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 FOREIGN KEY(reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
 INDEX idx_report_status(status), INDEX idx_report_user(user_id), INDEX idx_report_category(category)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS incident_photos (
 id INT AUTO_INCREMENT PRIMARY KEY,
 report_id INT NOT NULL,
 file_name VARCHAR(255) NOT NULL,
 original_name VARCHAR(255) NOT NULL,
 mime_type VARCHAR(80) NOT NULL,
 uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(report_id) REFERENCES incident_reports(id) ON DELETE CASCADE,
 INDEX idx_photo_report(report_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS assistance_requests (
 id INT AUTO_INCREMENT PRIMARY KEY,
 user_id INT NOT NULL,
 request_type ENUM('Medical','Rescue','Relief Goods','Other') NOT NULL,
 description TEXT NOT NULL,
 location VARCHAR(255) NOT NULL,
 barangay VARCHAR(120),
 contact_number VARCHAR(40),
 urgency ENUM('Normal','Urgent','Life-threatening') DEFAULT 'Normal',
 status ENUM('Pending','Accepted','In Progress','Completed','Rejected') DEFAULT 'Pending',
 admin_notes TEXT,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 INDEX idx_assist_status(status), INDEX idx_assist_user(user_id), INDEX idx_assist_urgency(urgency)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS relief_records (
 id INT AUTO_INCREMENT PRIMARY KEY,
 item_name VARCHAR(180) NOT NULL,
 description TEXT,
 quantity_available INT DEFAULT 0,
 distribution_location VARCHAR(255),
 distribution_date DATE,
 status ENUM('Available','Limited','Unavailable','Distributed') DEFAULT 'Available',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 INDEX idx_relief_status(status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS moderation_logs (
 id INT AUTO_INCREMENT PRIMARY KEY,
 record_type VARCHAR(40) NOT NULL,
 record_id INT NOT NULL,
 action VARCHAR(80) NOT NULL,
 reason TEXT,
 performed_by INT NOT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(performed_by) REFERENCES users(id),
 INDEX idx_moderation_record(record_type,record_id)
) ENGINE=InnoDB;

-- Safe, clearly labeled sample directory and public information records.
INSERT INTO healthcare_facilities(name,facility_type,address,barangay,phone,operating_hours,latitude,longitude,services)
SELECT 'Sample Community Health Center','Health Center','Replace with verified local address','Sample Barangay','Verify with LGU','Verify schedule',14.5547,121.0244,'Primary care; vaccination'
WHERE NOT EXISTS (SELECT 1 FROM healthcare_facilities WHERE name='Sample Community Health Center');

INSERT INTO evacuation_centers(name,address,barangay,facilities,contact_number,capacity,current_status,latitude,longitude)
SELECT 'Sample Evacuation Center','Replace with verified local address','Sample Barangay','Restrooms; water station','Verify with LGU',100,'Unknown',14.5547,121.0244
WHERE NOT EXISTS (SELECT 1 FROM evacuation_centers WHERE name='Sample Evacuation Center');

INSERT INTO disaster_warnings(title,description,hazard_type,severity,status,source_name,source_url,area_name)
SELECT 'Sample warning record - verify before use','This is demonstration data only. It is NOT a live official warning. Admin must replace or deactivate it.','Other','Low','Monitoring','Demonstration data','https://www.pagasa.dost.gov.ph/','Sample Area'
WHERE NOT EXISTS (SELECT 1 FROM disaster_warnings WHERE title='Sample warning record - verify before use');

INSERT INTO relief_records(item_name,description,quantity_available,distribution_location,status)
SELECT 'Sample hygiene kit','Demonstration data; confirm actual stock with the LGU.',0,'Confirm with local LGU','Unavailable'
WHERE NOT EXISTS (SELECT 1 FROM relief_records WHERE item_name='Sample hygiene kit');
