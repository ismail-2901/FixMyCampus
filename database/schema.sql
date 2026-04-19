-- ============================================================
-- FixMyCampus
-- Complete Database Schema
-- Import this file in phpMyAdmin, then run: node server/seed.js
-- ============================================================

DROP DATABASE IF EXISTS fixmy_campus;
CREATE DATABASE fixmy_campus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fixmy_campus;

CREATE TABLE Departments (
  department_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student','staff','admin','superadmin') NOT NULL DEFAULT 'student',
  department_id INT,
  student_id VARCHAR(50),
  is_verified BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  verification_code VARCHAR(10),
  verification_expires DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES Departments(department_id) ON DELETE SET NULL
);

CREATE TABLE Anonymous_ID (
  anon_id VARCHAR(20) PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE Categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE Reports (
  report_id VARCHAR(20) PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category_id INT NOT NULL,
  department_id INT NOT NULL,
  status ENUM('Pending','In Progress','Resolved','Rejected') DEFAULT 'Pending',
  is_approved BOOLEAN DEFAULT FALSE,
  awaiting_closure BOOLEAN DEFAULT FALSE,
  closure_asked_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES Categories(category_id),
  FOREIGN KEY (department_id) REFERENCES Departments(department_id)
);

CREATE TABLE Attachments (
  attachment_id INT AUTO_INCREMENT PRIMARY KEY,
  report_id VARCHAR(20) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(50),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES Reports(report_id) ON DELETE CASCADE
);

CREATE TABLE Report_Responses (
  response_id INT AUTO_INCREMENT PRIMARY KEY,
  report_id VARCHAR(20) NOT NULL,
  admin_id INT NOT NULL,
  message TEXT NOT NULL,
  attachment_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES Reports(report_id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES Users(user_id)
);

CREATE TABLE Comments (
  comment_id INT AUTO_INCREMENT PRIMARY KEY,
  report_id VARCHAR(20) NOT NULL,
  user_id INT NOT NULL,
  parent_comment_id INT DEFAULT NULL,
  content TEXT NOT NULL,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES Reports(report_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (parent_comment_id) REFERENCES Comments(comment_id) ON DELETE CASCADE
);

CREATE TABLE Reactions (
  reaction_id INT AUTO_INCREMENT PRIMARY KEY,
  report_id VARCHAR(20),
  comment_id INT,
  user_id INT NOT NULL,
  type ENUM('like','dislike','warning','love') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES Reports(report_id) ON DELETE CASCADE,
  FOREIGN KEY (comment_id) REFERENCES Comments(comment_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE Chats (
  chat_id INT AUTO_INCREMENT PRIMARY KEY,
  user1_id INT NOT NULL,
  user2_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_chat (user1_id, user2_id),
  FOREIGN KEY (user1_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (user2_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE Messages (
  message_id INT AUTO_INCREMENT PRIMARY KEY,
  chat_id INT NOT NULL,
  sender_id INT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chat_id) REFERENCES Chats(chat_id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE Group_Discussions (
  group_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES Users(user_id)
);

CREATE TABLE Group_Members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  user_id INT NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_member (group_id, user_id),
  FOREIGN KEY (group_id) REFERENCES Group_Discussions(group_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE Group_Posts (
  post_id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES Group_Discussions(group_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE AI_Chat_Log (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  user_message TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE Admin_Assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  department_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_assignment (admin_id, department_id),
  FOREIGN KEY (admin_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES Departments(department_id) ON DELETE CASCADE
);

INSERT INTO Departments (name) VALUES
('Software Engineering'),('Computer Science and Engineering'),
('Information Technology and Management'),('Multimedia and Creative Technology'),
('Electrical and Electronic Engineering'),('Civil Engineering'),
('Architecture'),('Business Administration'),('Real Estate'),
('Tourism and Hospitality Management'),('Law'),('English'),
('Journalism and Media Communication'),('Public Health'),('Pharmacy'),
('Nutrition and Food Engineering'),('Environmental Science'),('Agricultural Science');

INSERT INTO Categories (name) VALUES
('Infrastructure'),('Internet Problems'),('Academic Issue'),
('Harassment'),('Cleanliness'),('Security'),('Administration'),('Transport'),('Others');
