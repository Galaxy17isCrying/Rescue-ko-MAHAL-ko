ALTER TABLE users MODIFY COLUMN role ENUM('user','admin','employee') NOT NULL DEFAULT 'user';
ALTER TABLE users ADD COLUMN suspended_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN suspension_reason VARCHAR(255) NULL;

CREATE TABLE IF NOT EXISTS relief_requests (
 id INT AUTO_INCREMENT PRIMARY KEY,
 user_id INT NOT NULL,
 household_size TINYINT UNSIGNED NOT NULL,
 location VARCHAR(255) NOT NULL,
 barangay VARCHAR(120) NOT NULL,
 contact_number VARCHAR(40) NULL,
 notes TEXT NULL,
 status ENUM('Pending','Verified','Assigned','Distributed','Rejected') NOT NULL DEFAULT 'Pending',
 admin_notes TEXT NULL,
 assigned_to INT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_relief_requests_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 CONSTRAINT fk_relief_requests_admin FOREIGN KEY(assigned_to) REFERENCES users(id) ON DELETE SET NULL,
 INDEX idx_relief_requests_status_created(status,created_at),
 INDEX idx_relief_requests_barangay(barangay)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS relief_request_items (
 id INT AUTO_INCREMENT PRIMARY KEY,
 request_id INT NOT NULL,
 category ENUM('Food','Drinking water','Medicine','Hygiene','Infant supplies','Shelter','Clothing','Other') NOT NULL,
 quantity SMALLINT UNSIGNED NOT NULL DEFAULT 1,
 CONSTRAINT fk_relief_request_items_request FOREIGN KEY(request_id) REFERENCES relief_requests(id) ON DELETE CASCADE,
 UNIQUE KEY uq_relief_request_category(request_id,category),
 INDEX idx_relief_request_items_category(category)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS announcements (
 id INT AUTO_INCREMENT PRIMARY KEY,
 title VARCHAR(180) NOT NULL,
 body TEXT NOT NULL,
 severity ENUM('Information','Advisory','Urgent','Emergency') NOT NULL DEFAULT 'Information',
 audience ENUM('All','Barangay') NOT NULL DEFAULT 'All',
 target_barangay VARCHAR(120) NULL,
 source_name VARCHAR(120) NOT NULL,
 source_url VARCHAR(500) NULL,
 status ENUM('Draft','Published','Cancelled') NOT NULL DEFAULT 'Draft',
 starts_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 expires_at DATETIME NULL,
 created_by INT NULL,
 updated_by INT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_announcements_created_by FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL,
 CONSTRAINT fk_announcements_updated_by FOREIGN KEY(updated_by) REFERENCES users(id) ON DELETE SET NULL,
 INDEX idx_announcements_status_window(status,starts_at,expires_at),
 INDEX idx_announcements_target(audience,target_barangay)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS support_tickets (
 id INT AUTO_INCREMENT PRIMARY KEY,
 user_id INT NOT NULL,
 category ENUM('Complaint','Technical issue','Password/access help','Other') NOT NULL,
 subject VARCHAR(160) NOT NULL,
 message TEXT NOT NULL,
 status ENUM('Open','In Progress','Resolved') NOT NULL DEFAULT 'Open',
 admin_reply TEXT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_support_tickets_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 INDEX idx_support_tickets_status_updated(status,updated_at),
 INDEX idx_support_tickets_user_created(user_id,created_at)
) ENGINE=InnoDB;
