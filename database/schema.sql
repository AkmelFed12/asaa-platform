-- Create database
CREATE DATABASE IF NOT EXISTS asaa_db;

\c asaa_db;

-- Enum for delegation types
CREATE TYPE delegation_type AS ENUM (
  'mobilisation',
  'social',
  'culturel',
  'evenements',
  'communication',
  'finance',
  'autre'
);

-- Enum for user roles
CREATE TYPE user_role AS ENUM (
  'admin',
  'president',
  'vice_president',
  'secretaire_general',
  'delegue',
  'membre',
  'guest'
);

-- Enum for governance positions
CREATE TYPE governance_position_type AS ENUM (
  'president',
  'vice_president',
  'secretaire_general',
  'delegue_mobilisation',
  'delegue_social',
  'delegue_culturel',
  'delegue_evenements',
  'delegue_communication',
  'delegue_finance'
);

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Delegations table (Délégations)
CREATE TABLE IF NOT EXISTS delegations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  type delegation_type NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table (Utilisateurs et Délégués)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role user_role DEFAULT 'membre',
  delegation_id INTEGER REFERENCES delegations(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Members table (Membres de l'Association)
CREATE TABLE IF NOT EXISTS members (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  member_number VARCHAR(50) UNIQUE,
  date_of_birth DATE,
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  date_joined DATE DEFAULT CURRENT_DATE,
  status VARCHAR(50) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Governance positions (Postes de Gouvernance)
CREATE TABLE IF NOT EXISTS governance_positions (
  id SERIAL PRIMARY KEY,
  position_type governance_position_type NOT NULL UNIQUE,
  position_name VARCHAR(100) NOT NULL,
  description TEXT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  delegation_id INTEGER REFERENCES delegations(id) ON DELETE SET NULL,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events table (Événements)
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(100),
  date_event DATE NOT NULL,
  time_start TIME,
  time_end TIME,
  location VARCHAR(255),
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  delegation_id INTEGER REFERENCES delegations(id) ON DELETE SET NULL,
  capacity INTEGER,
  attendees_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'planified',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Event attendees (Participants d'événements)
CREATE TABLE IF NOT EXISTS event_attendees (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'confirmed',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, user_id)
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Announcements table (Annonces)
CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  delegation_id INTEGER REFERENCES delegations(id) ON DELETE SET NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100),
  resource_id INTEGER,
  changes JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quiz Questions table (Questions du Quiz Islamique)
CREATE TABLE IF NOT EXISTS quiz_questions (
  id SERIAL PRIMARY KEY,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer VARCHAR(1) NOT NULL CHECK (correct_answer IN ('a', 'b', 'c', 'd')),
  explanation TEXT,
  category VARCHAR(100),
  difficulty_level VARCHAR(20) DEFAULT 'medium',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quiz Attempts (Tentatives du Quiz)
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  score INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 20,
  time_spent_seconds INTEGER,
  status VARCHAR(50) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quiz Answers (Réponses aux Questions du Quiz)
CREATE TABLE IF NOT EXISTS quiz_answers (
  id SERIAL PRIMARY KEY,
  attempt_id INTEGER NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  user_answer VARCHAR(1),
  is_correct BOOLEAN,
  answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_events_date ON events(date_event);
CREATE INDEX idx_events_delegation ON events(delegation_id);
CREATE INDEX idx_announcements_delegation ON announcements(delegation_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_date ON quiz_attempts(quiz_date);
CREATE INDEX idx_quiz_answers_attempt_id ON quiz_answers(attempt_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default roles
INSERT INTO roles (name, description, permissions) VALUES
('Admin', 'Administrateur avec accès complet', '["read_all", "write_all", "delete_all", "manage_users", "manage_roles"]'::jsonb),
('Président', 'Président de l''association', '["read_all", "approve_events", "manage_delegations"]'::jsonb),
('Vice-Président', 'Vice-président de l''association', '["read_all", "approve_events"]'::jsonb),
('Secrétaire Général', 'Secrétaire général', '["read_all", "create_announcements", "manage_members"]'::jsonb),
('Délégué', 'Délégué de delegation', '["read_delegation", "create_events", "manage_delegation_members"]'::jsonb),
('Membre', 'Membre de l''association', '["read_public", "attend_events", "view_announcements"]'::jsonb)
ON CONFLICT DO NOTHING;

-- Insert default delegations
INSERT INTO delegations (name, type, description) VALUES
('Mobilisation', 'mobilisation', 'Délégation chargée de la mobilisation des membres'),
('Social', 'social', 'Délégation en charge des actions sociales'),
('Culturel', 'culturel', 'Délégation responsable des activités culturelles'),
('Événements', 'evenements', 'Organisation des événements et manifestations'),
('Communication', 'communication', 'Gestion de la communication interne et externe'),
('Finance', 'finance', 'Gestion des finances et du budget')
ON CONFLICT DO NOTHING;

-- Insert default governance positions
INSERT INTO governance_positions (position_type, position_name, description) VALUES
('president', 'Président', 'Responsable de la direction générale de l''association'),
('vice_president', 'Vice-Président', 'Assiste le président et le remplace en cas d''absence'),
('secretaire_general', 'Secrétaire Général', 'Responsable de l''administration et de la correspondance'),
('delegue_mobilisation', 'Délégué à la Mobilisation', 'Chargé de mobiliser les membres'),
('delegue_social', 'Délégué Social', 'Responsable des actions sociales'),
('delegue_culturel', 'Délégué Culturel', 'Organise les activités culturelles'),
('delegue_evenements', 'Délégué aux Événements', 'Organise les événements et manifestations'),
('delegue_communication', 'Délégué Communication', 'Gère la communication et les médias'),
('delegue_finance', 'Délégué Finance', 'Gère les finances et le budget')
ON CONFLICT DO NOTHING;

-- Insert sample admin user
INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active)
VALUES ('admin', 'admin@asaa.com', 'hashed_password_here', 'Admin', 'ASAA', 'admin', true)
ON CONFLICT DO NOTHING;

-- Insert sample Islamic Quiz Questions (20 questions)
INSERT INTO quiz_questions (question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, category, difficulty_level) VALUES
('Combien de piliers y a-t-il dans l''Islam?', '4', '5', '6', '7', 'b', 'Les 5 piliers de l''Islam sont: la Chahada, la Salat, la Zakat, le Sawm et le Hajj.', 'Fondamentaux de l''Islam', 'easy'),
('Quel est le premier pilier de l''Islam?', 'La prière', 'L''attestation de foi (Chahada)', 'L''aumône', 'Le jeûne', 'b', 'La Chahada est la première condition pour devenir musulman.', 'Fondamentaux de l''Islam', 'easy'),
('En quel année le Coran a-t-il été révélé?', '620 CE', '630 CE', '610 CE', '640 CE', 'c', 'La première révélation du Coran au Prophète Muhammad s''est déroulée en 610 CE.', 'Histoire Islamique', 'medium'),
('Quel prophète a construit la Kaaba?', 'Abraham et Ismaël', 'Moïse et Aaron', 'Noé', 'David', 'a', 'Selon le Coran, Ibrahim et Ismaïl ont construit la Kaaba.', 'Prophètes', 'medium'),
('Combien de fois par jour un musulman doit-il prier?', '3 fois', '4 fois', '5 fois', '6 fois', 'c', 'Les 5 prières obligatoires sont: Fajr, Dhuhr, Asr, Maghrib et Isha.', 'Pratique Islamique', 'easy'),
('En quel mois doit-on jeûner?', 'Muharram', 'Rajab', 'Ramadan', 'Dhul-Hijjah', 'c', 'Le jeûne du Ramadan est le 4ème pilier de l''Islam.', 'Pratique Islamique', 'easy'),
('Quel est le dernier prophète envoyé par Allah?', 'Moïse', 'Jésus', 'Muhammad', 'Abraham', 'c', 'Le Prophète Muhammad est le dernier prophète selon l''Islam.', 'Prophètes', 'easy'),
('Combien de sourates le Coran contient-il?', '104', '114', '124', '134', 'b', 'Le Coran contient exactement 114 sourates.', 'Le Coran', 'medium'),
('Quel est le plus grand mois du calendrier islamique?', 'Ramadan', 'Muharram', 'Dhul-Hijjah', 'Rajab', 'a', 'Le Ramadan est le 9ème mois du calendrier lunaire islamique.', 'Calendrier Islamique', 'medium'),
('Qui était le premier calife après le Prophète Muhammad?', 'Omar ibn al-Khattab', 'Othman ibn Affan', 'Ali ibn Abi Talib', 'Abou Bakr as-Siddiq', 'd', 'Abou Bakr as-Siddiq a été le premier calife bien-guidé.', 'Histoire Islamique', 'medium'),
('La Zakat est obligatoire sur quel type de richesse?', 'Seulement l''or', 'Seulement l''argent', 'Toute forme de richesse qui atteint le Nisab', 'Seulement les terres', 'c', 'La Zakat s''applique à toute richesse accumulée dépassant le Nisab.', 'Pratique Islamique', 'hard'),
('Combien d''années le Prophète Muhammad a-t-il prêché?', '13 ans', '23 ans', '33 ans', '43 ans', 'b', 'Le Prophète a prêché l''Islam pendant 23 ans.', 'Histoire Islamique', 'medium'),
('Quel est le nom de la migration du Prophète de La Mecque à Médine?', 'Hijrah', 'Hadj', 'Haram', 'Haraka', 'a', 'La Hijrah marque le début du calendrier islamique.', 'Histoire Islamique', 'medium'),
('Combien de versets le Coran contient-il?', '6000', '6236', '8000', '10000', 'b', 'Le Coran contient 6236 versets selon la majorité des savants.', 'Le Coran', 'hard'),
('Quel était le métier du Prophète Muhammad avant sa mission prophétique?', 'Agriculteur', 'Marchand', 'Berger', 'Soldat', 'b', 'Le Prophète était marchand, travaillant pour Khadija.', 'Biographie du Prophète', 'easy'),
('En quel lieu a eu lieu la bataille de Badr?', 'Uhud', 'Khandaq', 'Badr', 'Muta', 'c', 'La bataille de Badr a eu lieu en 625 CE en Arabie Saoudite.', 'Histoire Islamique', 'medium'),
('Combien de fils avait le Prophète Muhammad?', '2', '3', '4', '5', 'b', 'Le Prophète avait 3 fils: Al-Qasim, Abdullah et Ibrahim.', 'Biographie du Prophète', 'hard'),
('Quel est le titre donné à celui qui a mémorisé le Coran entièrement?', 'Qari''', 'Hafiz', 'Mufti', 'Imam', 'b', 'Un Hafiz est celui qui a mémorisé les 114 sourates du Coran.', 'Terme Islamique', 'easy'),
('La première mosquée construite en Islam a été construite dans quel lieu?', 'La Mecque', 'Jérusalem', 'Médine', 'Damas', 'c', 'La mosquée de Quba a été la première mosquée construite à Médine.', 'Histoire Islamique', 'hard'),
('Quel est le mois où a eu lieu la révélation du Coran?', 'Muharram', 'Ramadan', 'Dhul-Hijjah', 'Safar', 'b', 'Le Coran a été révélé durant le Ramadan de l''année 610 CE.', 'Le Coran', 'easy');

