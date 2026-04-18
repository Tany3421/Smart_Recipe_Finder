-- ═══════════════════════════════════════════════════════════════
--  Smart Recipe Finder — Database Schema
--  Run: mysql -u root -p < database/schema.sql
-- ═══════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS smart_recipe_finder
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smart_recipe_finder;

-- ─── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           VARCHAR(36)  PRIMARY KEY,
  username     VARCHAR(50)  NOT NULL UNIQUE,
  email        VARCHAR(100) NOT NULL UNIQUE,
  password     VARCHAR(255) NOT NULL,
  role         ENUM('admin','user') NOT NULL DEFAULT 'user',
  reset_token  VARCHAR(36)  DEFAULT NULL,
  reset_expiry BIGINT       DEFAULT NULL,
  created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─── Recipes ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recipes (
  id          VARCHAR(36)   PRIMARY KEY,
  title       VARCHAR(255)  NOT NULL,
  description TEXT,
  category    VARCHAR(100),
  meal_type   ENUM('Breakfast','Brunch','Lunch','Dinner','Snack','Dessert','Any')
              NOT NULL DEFAULT 'Any',
  cuisine     VARCHAR(100),
  prep_time   INT           DEFAULT 0,
  cook_time   INT           DEFAULT 0,
  servings    INT           DEFAULT 4,
  difficulty  ENUM('Easy','Medium','Hard') DEFAULT 'Medium',
  ingredients JSON,
  steps       JSON,
  images      JSON,
  video       VARCHAR(600)  DEFAULT '',
  tags        JSON,
  featured    TINYINT(1)    DEFAULT 0,
  rating      DECIMAL(3,2)  DEFAULT 4.50,
  created_at  DATETIME      DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─── Favorites ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favorites (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    VARCHAR(36) NOT NULL,
  recipe_id  VARCHAR(36) NOT NULL,
  created_at DATETIME    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_fav (user_id, recipe_id),
  FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Meal Plans (one row per user × week) ─────────────────────
CREATE TABLE IF NOT EXISTS meal_plans (
  id          VARCHAR(36) PRIMARY KEY,
  user_id     VARCHAR(36) NOT NULL,
  week_start  DATE        NOT NULL,
  created_at  DATETIME    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_plan (user_id, week_start),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Meal Plan Items ──────────────────────────────────────────
-- day_of_week: 0=Monday … 6=Sunday
-- One recipe per (plan, day, meal_type) slot
CREATE TABLE IF NOT EXISTS meal_plan_items (
  id           VARCHAR(36) PRIMARY KEY,
  plan_id      VARCHAR(36) NOT NULL,
  day_of_week  TINYINT     NOT NULL,
  meal_type    ENUM('Breakfast','Brunch','Lunch','Dinner','Snack','Dessert') NOT NULL,
  recipe_id    VARCHAR(36) NOT NULL,
  FOREIGN KEY (plan_id)    REFERENCES meal_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (recipe_id)  REFERENCES recipes(id)   ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Feedbacks & Suggestions ──────────────────────────────────
CREATE TABLE IF NOT EXISTS feedbacks (
  id           VARCHAR(36) PRIMARY KEY,
  user_id      VARCHAR(36) NOT NULL,
  recipe_id    VARCHAR(36) DEFAULT NULL,
  type         ENUM('feedback','suggestion') NOT NULL DEFAULT 'feedback',
  message      TEXT NOT NULL,
  status       ENUM('pending','read') NOT NULL DEFAULT 'pending',
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
) ENGINE=InnoDB;
