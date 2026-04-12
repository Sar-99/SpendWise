const { db } = require('../config/database');

class CompletedTask {
    static async create(taskData) {
        const id = require('../config/database').generateId();
        const { profileId, description, type, totalAmount, startDate, endDate } = taskData;
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO completed_tasks 
         (id, profile_id, description, type, total_amount, start_date, end_date)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [id, profileId, description, type, totalAmount, startDate, endDate],
                function (err) {
                    if (err) reject(err);
                    db.get('SELECT * FROM completed_tasks WHERE id = ?', [id], (err, row) => {
                        if (err) reject(err);
                        resolve(row);
                    });
                }
            );
        });
    }

    static async findByProfileId(profileId) {
        return new Promise((resolve, reject) => {
            db.all(
                'SELECT * FROM completed_tasks WHERE profile_id = ? ORDER BY end_date DESC',
                [profileId],
                (err, rows) => {
                    if (err) reject(err);
                    resolve(rows);
                }
            );
        });
    }
}

module.exports = CompletedTask;