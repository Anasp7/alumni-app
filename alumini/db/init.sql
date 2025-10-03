CREATE DATABASE IF NOT EXISTS alumni_connect;
USE alumni_connect;

-- Users table with authentication
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role ENUM('alumni','student','admin') NOT NULL DEFAULT 'student',
  graduation_year INT,
  major VARCHAR(100),
  company VARCHAR(100),
  position VARCHAR(100),
  bio TEXT,
  skills TEXT,
  -- Student specific fields
  cgpa DECIMAL(3,2),
  reservation_category VARCHAR(50),
  is_lateral_entry BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Job/Internship postings
CREATE TABLE IF NOT EXISTS opportunities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  company VARCHAR(100) NOT NULL,
  description TEXT,
  requirements TEXT,
  location VARCHAR(100),
  salary_range VARCHAR(50),
  type ENUM('full-time','part-time','internship','contract') NOT NULL,
  posted_by INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Scholarships
CREATE TABLE IF NOT EXISTS scholarships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  amount DECIMAL(10,2),
  deadline DATE,
  requirements TEXT,
  -- Eligibility criteria
  min_cgpa DECIMAL(3,2),
  reservation_category VARCHAR(50), -- General, OBC, SC, ST, EWS, etc.
  lateral_entry_allowed BOOLEAN DEFAULT TRUE,
  eligible_years TEXT, -- JSON array of eligible years: ["2024", "2025"]
  eligible_majors TEXT, -- JSON array of majors
  other_criteria TEXT,
  posted_by INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Mentorship requests
CREATE TABLE IF NOT EXISTS mentorship_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  mentor_id INT NOT NULL,
  subject VARCHAR(200) NOT NULL,
  message TEXT,
  status ENUM('pending','accepted','rejected','completed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Applications for jobs/scholarships
CREATE TABLE IF NOT EXISTS applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  applicant_id INT NOT NULL,
  opportunity_id INT,
  scholarship_id INT,
  type ENUM('job','scholarship') NOT NULL,
  status ENUM('submitted','under_review','accepted','rejected') DEFAULT 'submitted',
  cover_letter TEXT,
  resume_url VARCHAR(500),
  -- Scholarship application specific fields
  document_urls TEXT, -- JSON array of uploaded document URLs
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (applicant_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
  FOREIGN KEY (scholarship_id) REFERENCES scholarships(id) ON DELETE CASCADE
);

-- Messages between users
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  subject VARCHAR(200),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Success stories
CREATE TABLE IF NOT EXISTS stories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  author_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert demo data
INSERT INTO users (email, password_hash, name, role, graduation_year, major, company, position, bio, skills) VALUES
  ('alice@alumni.edu', '$2b$12$CgkJxu49qllIpCNNTwaVQu6wCeojAewFfBBmCokbwhW3k/djaCT2e', 'Alice Johnson', 'alumni', 2020, 'Computer Science', 'Google', 'Software Engineer', 'Passionate about helping students succeed in tech careers.', 'Python, JavaScript, React, Machine Learning'),
  ('bob@alumni.edu', '$2b$12$CgkJxu49qllIpCNNTwaVQu6wCeojAewFfBBmCokbwhW3k/djaCT2e', 'Bob Smith', 'alumni', 2019, 'Business Administration', 'Microsoft', 'Product Manager', 'Experienced in product strategy and team leadership.', 'Product Management, Strategy, Leadership'),
  ('sarah@student.edu', '$2b$12$CgkJxu49qllIpCNNTwaVQu6wCeojAewFfBBmCokbwhW3k/djaCT2e', 'Sarah Wilson', 'student', 2024, 'Computer Science', NULL, NULL, 'Final year CS student looking for internship opportunities.', 'Java, Python, Web Development'),
  ('mike@student.edu', '$2b$12$CgkJxu49qllIpCNNTwaVQu6wCeojAewFfBBmCokbwhW3k/djaCT2e', 'Mike Davis', 'student', 2025, 'Business Administration', NULL, NULL, 'Sophomore business student interested in entrepreneurship.', 'Business Analysis, Marketing, Finance')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO opportunities (title, company, description, requirements, location, salary_range, type, posted_by) VALUES
  ('Software Engineering Intern', 'Google', 'Join our team for a 12-week summer internship working on cutting-edge projects.', 'Python, JavaScript, CS fundamentals', 'Mountain View, CA', '$8,000/month', 'internship', 1),
  ('Product Management Intern', 'Microsoft', 'Work with our product team to define and deliver user experiences.', 'Business acumen, communication skills', 'Seattle, WA', '$7,500/month', 'internship', 2),
  ('Full Stack Developer', 'StartupXYZ', 'Build web applications using modern technologies.', 'React, Node.js, SQL', 'Remote', '$80,000-120,000', 'full-time', 1)
ON DUPLICATE KEY UPDATE title=VALUES(title);

INSERT INTO scholarships (title, description, amount, deadline, requirements, posted_by) VALUES
  ('Tech Innovation Scholarship', 'For students pursuing technology and innovation.', 5000.00, '2024-12-31', 'CS major, 3.5+ GPA', 1),
  ('Business Leadership Award', 'Supporting future business leaders.', 3000.00, '2024-11-30', 'Business major, leadership experience', 2)
ON DUPLICATE KEY UPDATE title=VALUES(title);

INSERT INTO mentorship_requests (student_id, mentor_id, subject, message, status) VALUES
  (3, 1, 'Career Guidance in Tech', 'I would love to learn about your journey from student to Google engineer.', 'accepted'),
  (4, 2, 'Product Management Career', 'Interested in understanding product management roles.', 'pending')
ON DUPLICATE KEY UPDATE subject=VALUES(subject);

INSERT INTO applications (applicant_id, opportunity_id, type, status, cover_letter) VALUES
  (3, 1, 'job', 'submitted', 'I am excited to apply for the Software Engineering Intern position...'),
  (4, 2, 'job', 'under_review', 'My business background and passion for technology make me a great fit...')
ON DUPLICATE KEY UPDATE cover_letter=VALUES(cover_letter);

INSERT INTO stories (author_id, title, content, category, is_featured) VALUES
  (1, 'From Campus to Google: My Journey', 'Starting as a CS student, I never imagined I would end up at Google...', 'Career Success', TRUE),
  (2, 'Building Products That Matter', 'Product management taught me that technology is about solving real problems...', 'Career Advice', FALSE)
ON DUPLICATE KEY UPDATE title=VALUES(title);


