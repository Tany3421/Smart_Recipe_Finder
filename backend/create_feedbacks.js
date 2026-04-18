require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  let conn;
  try {
    conn = await mysql.createConnection({
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT) || 3306,
      user:     process.env.DB_USER     || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME     || 'smart_recipe_finder',
    });
    
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS feedbacks (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        recipe_id VARCHAR(36),
        type ENUM('feedback', 'suggestion') NOT NULL,
        message TEXT NOT NULL,
        status ENUM('pending', 'read') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
      );
    `);
    console.log("SUCCESS: Table 'feedbacks' created successfully!");
  } catch (error) {
    console.error("ERROR creating table:", error);
  } finally {
    if (conn) await conn.end();
    process.exit(0);
  }
}

run();
