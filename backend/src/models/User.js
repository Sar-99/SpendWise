const { db } = require('../config/database');

class User {
  static async create(nickname, passwordHash) {
    const id = require('../config/database').generateId();
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (id, nickname, password_hash) VALUES (?, ?, ?)',
        [id, nickname, passwordHash],
        function(err) {
          if (err) reject(err);
          resolve({ id, nickname });
        }
      );
    });
  }

  static async findByNickname(nickname) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE nickname = ?', [nickname], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
  }
}

module.exports = User;