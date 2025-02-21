import { GoogleSpreadsheet } from 'google-spreadsheet';
import mysql from 'mysql2/promise';
import fs from 'fs';

const creds = JSON.parse(fs.readFileSync('google-credentials.json')); // Too lazy to use .env
const SHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
const doc = new GoogleSpreadsheet(SHEET_ID);

export async function syncDatabaseToSheets() {
    try {
        await doc.useServiceAccountAuth(creds);
        await doc.loadInfo();
        const sheet = doc.sheetsByIndex[0]; // Select first sheet

        // Get existing data from Google Sheets
        const rows = await sheet.getRows();
        const existingUserIds = rows.map(row => row.user_id); // Collect existing user IDs

        // Fetch new records from MySQL
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
        });

        const [newRows] = await connection.execute('SELECT * FROM daily_wins');
        connection.end();

        // Filter only new records
        const newEntries = newRows.filter(row => !existingUserIds.includes(row.user_id));

        // Insert only new entries
        if (newEntries.length > 0) {
            await sheet.addRows(newEntries);
            console.log(`✅ Added ${newEntries.length} new entries to Google Sheets.`);
        } else {
            console.log('✅ No new entries to add.');
        }
    } catch (error) {
        console.error('❌ Error syncing with Google Sheets:', error);
    }
}

// Run every hour
setInterval(syncDatabaseToSheets, 1000 * 60 * 60);

export { syncDatabaseToSheets };