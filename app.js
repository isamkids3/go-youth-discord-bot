import 'dotenv/config';
import express from 'express';
import {
  InteractionType,
  InteractionResponseType,
  MessageComponentTypes,
  verifyKeyMiddleware,
} from 'discord-interactions';

// Create and configure express app
const app = express();

let totalPhysicalWins = 0;
let totalMentalWins = 0;
let totalSpiritualWins = 0;

function formatCustomId(customId) {
  return customId
    .replace(/_/g, ' ')       // Replace underscores with spaces
    .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize the first letter of each word
}

app.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY), function (req, res) {
  // Interaction type and data
  const { type, data } = req.body;
  /**
   * Handle slash command requests
   */

  if (type === InteractionType.APPLICATION_COMMAND){
    // Slash command with name of "totalcount"
    if (data.name === 'totalcount'){
      const totalWins = totalPhysicalWins + totalMentalWins + totalSpiritualWins;
      //display total wins sent in the server
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { 
          content:
                 `Total physical wins submitted: **${totalPhysicalWins}**\n` +
                 `Total mental wins submitted: **${totalMentalWins}**\n` +
                 `Total spiritual wins submitted: **${totalSpiritualWins}**\n`+
                 `Total daily wins submitted: **${totalWins}**\n`,
        }
      })
    }
  }
  if (type === InteractionType.APPLICATION_COMMAND) {
    // Slash command with name of "dailywins"
    if (data.name === 'dailywins') {
      // Send a modal as response
      return res.send({
        type: InteractionResponseType.MODAL,
        data: {
          custom_id: 'my_modal',
          title: 'Submit your daily wins 🏆',
          components: [
            {
              // Text inputs must be inside of an action component
              type: MessageComponentTypes.ACTION_ROW,
              components: [
                {
                  // See https://discord.com/developers/docs/interactions/message-components#text-inputs-text-input-structure
                  type: MessageComponentTypes.INPUT_TEXT,
                  custom_id: 'physical_win',
                  style: 2,
                  required: false,
                  label: 'Physical Win 👟 ',
                },
              ],
            },
            {
              type: MessageComponentTypes.ACTION_ROW,
              components: [
                {
                  type: MessageComponentTypes.INPUT_TEXT,
                  custom_id: 'mental_win',
                  // Bigger text box for input
                  style: 2,
                  required: false,
                  label: 'Mental Win 🧠',
                },
              ],
            },
            {
              type: MessageComponentTypes.ACTION_ROW,
              components: [
                {
                  type: MessageComponentTypes.INPUT_TEXT,
                  custom_id: 'spiritual_win',
                  // Bigger text box for input
                  style: 2,
                  required: false,
                  label: 'Spiritual Win 📖 ',
                },
              ],
            },
          ],
        },
      });
    }
  }

  /**
   * Handle modal submissions
   */
  if (type === InteractionType.MODAL_SUBMIT) {
    const modalId = data.custom_id;
    const userId = req.body.member.user.id;

    if (modalId === 'my_modal') {
      let modalValues = '';

      // Loop through components and format custom IDs
      for (let action of data.components) {
        for (let inputComponent of action.components) {
          const formattedCustomId = formatCustomId(inputComponent.custom_id); // Format the custom_id
          const inputValue = inputComponent.value.trim(); // Get the trimmed value

          // assigns modal values to custom id
          if (inputValue) {
            modalValues += `**${formattedCustomId}**: ${inputValue}\n\n`;

            // Count each submission based on input value
            if (formattedCustomId.includes('Physical Win')) {
              totalPhysicalWins++;
            } else if (formattedCustomId.includes('Mental Win')) {
              totalMentalWins++;
            } else if (formattedCustomId.includes('Spiritual Win')) {
              totalSpiritualWins++;
            }
          }
        }
      }

    
    
      // fetch date
      const date = new Date();
      const formattedDate = `${date.getDate()} ${date.toLocaleString('en-US', { month: 'long' })} ${date.getFullYear()}`;

      //Send daily win message

      // if user does not input anything
      if (modalValues == "")
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE,
          data: {
            content: `'<@${userId}> did not input any daily win.`
          }
      })

      // User input
      else  
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: `<@${userId}>'s daily win on **${formattedDate}**:\n\n${modalValues}`,
        },
      });
    }
  }
});

app.listen(3000, () => {
  console.log('Listening on port 3000');
});