import 'dotenv/config';
import express from 'express';
import mysql from 'mysql2/promise';
import { 
  Client, GatewayIntentBits, InteractionType, InteractionResponseType, MessageComponentTypes 
} from 'discord.js';

// Setup MySQL connection
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Create the table if it doesn't exist
async function initializeDatabase() {
  const connection = await pool.getConnection();
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS daily_wins (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL,
      date DATE NOT NULL,
      physical_win TEXT,
      mental_win TEXT,
      spiritual_win TEXT,
      streak_count INT DEFAULT 1,
      last_submission DATE NOT NULL
    )
  `);
  connection.release();
}
initializeDatabase();

const app = express();
app.use(express.json());

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => console.log('Bot is online!'));

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const userId = interaction.user.id;
  const today = new Date().toISOString().split('T')[0];

  if (interaction.commandName === 'dailywins') {
    await interaction.reply({
      content: 'Submit your daily wins 🏆',
      ephemeral: true,
      components: [
        {
          type: MessageComponentTypes.ACTION_ROW,
          components: [
            { type: MessageComponentTypes.INPUT_TEXT, custom_id: 'physical_win', label: 'Physical Win 👟', style: 2, required: false },
            { type: MessageComponentTypes.INPUT_TEXT, custom_id: 'mental_win', label: 'Mental Win 🧠', style: 2, required: false },
            { type: MessageComponentTypes.INPUT_TEXT, custom_id: 'spiritual_win', label: 'Spiritual Win 📖', style: 2, required: false },
          ]
        }
      ]
    });
  }

  if (interaction.isModalSubmit()) {
    const physicalWin = interaction.fields.getTextInputValue('physical_win') || '';
    const mentalWin = interaction.fields.getTextInputValue('mental_win') || '';
    const spiritualWin = interaction.fields.getTextInputValue('spiritual_win') || '';

    if (!physicalWin && !mentalWin && !spiritualWin) {
      return interaction.reply({ content: 'You did not input any daily wins.', ephemeral: true });
    }

    let streakCount = 1;
    const connection = await pool.getConnection();
    
    try {
      // Check last submission
      const [rows] = await connection.execute(
        'SELECT last_submission, streak_count FROM daily_wins WHERE user_id = ? ORDER BY date DESC LIMIT 1',
        [userId]
      );

      if (rows.length > 0) {
        const lastDate = new Date(rows[0].last_submission);
        const diffDays = (new Date(today) - lastDate) / (1000 * 60 * 60 * 24);

        if (diffDays === 1) streakCount = rows[0].streak_count + 1; // Increment streak
        else if (diffDays > 1) streakCount = 1; // Reset streak
        else streakCount = rows[0].streak_count; // Keep streak
      }

      // Insert new record
      await connection.execute(
        `INSERT INTO daily_wins (user_id, date, physical_win, mental_win, spiritual_win, streak_count, last_submission) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, today, physicalWin, mentalWin, spiritualWin, streakCount, today]
      );

      await interaction.reply({
        content: `Your daily win has been recorded!\n\n🏆 **Current Streak:** ${streakCount} days`,
        ephemeral: true
      });
    } catch (error) {
      console.error('Database error:', error);
      await interaction.reply({ content: 'An error occurred while saving your daily win.', ephemeral: true });
    } finally {
      connection.release();
    }
  }
});

client.login(process.env.TOKEN);
app.listen(3000, () => console.log('Server is running on port 3000'));