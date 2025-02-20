import { Client, GatewayIntentBits, Events, ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle, SlashCommandBuilder } from 'discord.js';
import 'dotenv/config';

// Initialize Discord Client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers],
});

// Variables to store total counts (these reset when the bot restarts)
let totalPhysicalWins = 0;
let totalMentalWins = 0;
let totalSpiritualWins = 0;

// Register commands (you should deploy them separately using a command registration script)
const commands = [
  new SlashCommandBuilder().setName('totalcount').setDescription('Shows total daily wins submitted'),
  new SlashCommandBuilder().setName('dailywins').setDescription('Submit your daily wins'),
];

// Bot Ready Event
client.once(Events.ClientReady, () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Interaction Event Listener
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isCommand() && !interaction.isModalSubmit()) return;

  // Handle "/totalcount" Slash Command
  if (interaction.commandName === 'totalcount') {
    const totalWins = totalPhysicalWins + totalMentalWins + totalSpiritualWins;

    await interaction.reply({
      content: `🏆 **Total Wins Summary** 🏆\n\n` +
               `- **Physical Wins:** ${totalPhysicalWins}\n` +
               `- **Mental Wins:** ${totalMentalWins}\n` +
               `- **Spiritual Wins:** ${totalSpiritualWins}\n` +
               `- **Total Daily Wins:** ${totalWins}\n`,
      ephemeral: false,
    });
  }

  // Handle "/dailywins" Slash Command (Shows Modal)
  else if (interaction.commandName === 'dailywins') {
    const modal = new ModalBuilder()
      .setCustomId('dailywins_modal')
      .setTitle('Submit Your Daily Wins 🏆');

    const physicalWinInput = new TextInputBuilder()
      .setCustomId('physical_win')
      .setLabel('Physical Win 👟')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false);

    const mentalWinInput = new TextInputBuilder()
      .setCustomId('mental_win')
      .setLabel('Mental Win 🧠')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false);

    const spiritualWinInput = new TextInputBuilder()
      .setCustomId('spiritual_win')
      .setLabel('Spiritual Win 📖')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(physicalWinInput),
      new ActionRowBuilder().addComponents(mentalWinInput),
      new ActionRowBuilder().addComponents(spiritualWinInput)
    );

    await interaction.showModal(modal);
  }

  // Handle Modal Submission
  else if (interaction.isModalSubmit() && interaction.customId === 'dailywins_modal') {
    const userId = interaction.user.id;

    const physicalWin = interaction.fields.getTextInputValue('physical_win') || null;
    const mentalWin = interaction.fields.getTextInputValue('mental_win') || null;
    const spiritualWin = interaction.fields.getTextInputValue('spiritual_win') || null;

    let modalValues = '';
    
    if (physicalWin) {
      modalValues += `**Physical Win**: ${physicalWin}\n\n`;
      totalPhysicalWins++;
    }
    if (mentalWin) {
      modalValues += `**Mental Win**: ${mentalWin}\n\n`;
      totalMentalWins++;
    }
    if (spiritualWin) {
      modalValues += `**Spiritual Win**: ${spiritualWin}\n\n`;
      totalSpiritualWins++;
    }

    const date = new Date();
    const formattedDate = `${date.getDate()} ${date.toLocaleString('en-US', { month: 'long' })} ${date.getFullYear()}`;

    // If the user submits nothing, send a warning message
    if (!modalValues) {
      await interaction.reply({
        content: `<@${userId}>, you did not input any daily wins! 😢`,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: `🎉 <@${userId}>'s daily win on **${formattedDate}**:\n\n${modalValues}`,
        ephemeral: false,
      });
    }
  }
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);