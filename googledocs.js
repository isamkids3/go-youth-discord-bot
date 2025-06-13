import { GoogleSpreadsheet } from 'google-spreadsheet';
import { GoogleAuth } from 'google-auth-library';
import mysql from 'mysql2/promise';
import fs from 'fs';

const SHEET_ID = 'SHEET_ID';

// Load Google Service Account Credentials
const creds = JSON.parse(fs.readFileSync('google-credentials.json'));

// Authenticate using `GoogleAuth`
const auth = new GoogleAuth({
  credentials: creds,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const doc = new GoogleSpreadsheet(SHEET_ID, auth);

export async function syncDatabaseToSheets() {
  try {
    await doc.loadInfo(); // Load sheet metadata
    const sheet = doc.sheetsByIndex[0]; // First sheet

    console.log(`✅ Connected to Google Sheet: ${doc.title}`);

    // Fetch data from MySQL
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    const [rows] = await connection.execute('SELECT * FROM daily_wins');
    connection.end();

    if (rows.length === 0) {
        console.log('⚠️ No new data to sync.');
        return; // Exit the function if there's nothing to add
      }

    // Format data for Google Sheets
    const sheetData = [['ID', 'User ID', 'Date', 'Physical Win', 'Mental Win', 'Spiritual Win', 'Streak Count']];
    rows.forEach(row => {
      sheetData.push([row.id, row.user_id, row.date, row.physical_win, row.mental_win, row.spiritual_win, row.streak_count]);
    });

    // Clear existing data and insert new data
    await sheet.clear();
    await sheet.setHeaderRow(sheetData[0]);
    await sheet.addRows(sheetData.slice(1));

    console.log('✅ Successfully synced MySQL data to Google Sheets!');
  } catch (error) {
    console.error('❌ Error syncing with Google Sheets:', error);
  }
}