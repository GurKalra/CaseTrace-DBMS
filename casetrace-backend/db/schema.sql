-- =============================================
-- CaseTrace Database Schema
-- =============================================

CREATE DATABASE IF NOT EXISTS casetrace_db;
USE casetrace_db;

-- =============================================
-- Department Table
-- =============================================
CREATE TABLE IF NOT EXISTS Department (
    dept_id CHAR(36) NOT NULL PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL
);

-- =============================================
-- Officer Table
-- =============================================
CREATE TABLE IF NOT EXISTS Officer (
    officer_id CHAR(36) NOT NULL PRIMARY KEY,
    badge_number VARCHAR(50) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    rank_title VARCHAR(50) NOT NULL,
    dept_id CHAR(36),
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    FOREIGN KEY (dept_id) REFERENCES Department(dept_id)
);

-- =============================================
-- Citizen Table
-- =============================================
CREATE TABLE IF NOT EXISTS Citizen (
    citizen_id CHAR(36) NOT NULL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- 3.1.2 Unique Constraint on Citizen Email
    -- Ensures each citizen registers with only one unique email address
    CONSTRAINT unique_email UNIQUE(email)
);

-- =============================================
-- Complaint Table
-- =============================================
CREATE TABLE IF NOT EXISTS Complaint (
    complaint_id CHAR(36) NOT NULL PRIMARY KEY,
    citizen_id CHAR(36) NOT NULL,
    anonymous_token VARCHAR(100),
    incident_date DATETIME NOT NULL,
    incident_location VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    current_status VARCHAR(20) DEFAULT 'FILED',
    priority VARCHAR(10) DEFAULT 'MEDIUM',
    filed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- 3.1.1 Constraint on Complaint Priority
    -- Ensures priority can only be HIGH, MEDIUM, or LOW
    CONSTRAINT chk_priority CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),

    -- 3.1.3 Foreign Key Constraint Between Complaint and Citizen
    -- Ensures every complaint is associated with a valid registered citizen
    CONSTRAINT fk_citizen FOREIGN KEY (citizen_id) REFERENCES Citizen(citizen_id)
);

-- =============================================
-- Evidence Table
-- =============================================
CREATE TABLE IF NOT EXISTS Evidence (
    evidence_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    complaint_id CHAR(36) NOT NULL,
    uploaded_by_id CHAR(36),
    file_name VARCHAR(255),
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size_kb INT NOT NULL,
    sha256_hash CHAR(64) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_redacted TINYINT(1) DEFAULT 0,
    FOREIGN KEY (complaint_id) REFERENCES Complaint(complaint_id)
);

-- =============================================
-- InvestigationNote Table
-- =============================================
CREATE TABLE IF NOT EXISTS InvestigationNote (
    note_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    complaint_id CHAR(36) NOT NULL,
    officer_id CHAR(36) NOT NULL,
    note_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES Complaint(complaint_id),
    FOREIGN KEY (officer_id) REFERENCES Officer(officer_id)
);

-- =============================================
-- CaseAssignment Table
-- =============================================
CREATE TABLE IF NOT EXISTS CaseAssignment (
    assignment_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    complaint_id CHAR(36) NOT NULL,
    officer_id CHAR(36) NOT NULL,
    assigned_by_id CHAR(36) NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date DATETIME,
    FOREIGN KEY (complaint_id) REFERENCES Complaint(complaint_id),
    FOREIGN KEY (officer_id) REFERENCES Officer(officer_id)
);

-- =============================================
-- ComplaintStatusHistory Table
-- =============================================
CREATE TABLE IF NOT EXISTS ComplaintStatusHistory (
    history_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    complaint_id CHAR(36) NOT NULL,
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_by_id CHAR(36) NOT NULL,
    changed_by_role VARCHAR(20),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    FOREIGN KEY (complaint_id) REFERENCES Complaint(complaint_id)
);

-- =============================================
-- ActionTaken Table
-- =============================================
CREATE TABLE IF NOT EXISTS ActionTaken (
    action_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    complaint_id CHAR(36) NOT NULL,
    officer_id CHAR(36) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    action_details TEXT,
    action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES Complaint(complaint_id),
    FOREIGN KEY (officer_id) REFERENCES Officer(officer_id)
);

-- =============================================
-- AccessLog Table
-- =============================================
CREATE TABLE IF NOT EXISTS AccessLog (
    log_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    complaint_id CHAR(36) NOT NULL,
    accessed_by_id CHAR(36),
    accessed_by_role VARCHAR(20),
    access_type VARCHAR(10) NOT NULL,
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    FOREIGN KEY (complaint_id) REFERENCES Complaint(complaint_id)
);
