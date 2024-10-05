import 'dotenv/config';
import { getRPSChoices } from './game.js';
import { capitalize, InstallGlobalCommands } from './utils.js';

// Get the game choices from game.js
function createCommandChoices() {
  const choices = getRPSChoices();
  const commandChoices = [];

  for (let choice of choices) {
    commandChoices.push({
      name: capitalize(choice),
      value: choice.toLowerCase(),
    });
  }

  return commandChoices;
}

// daily wins command
const DAILYWINS_COMMAND = {
  name: 'dailywins',
  description: 'Submit your daily wins with this command!',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

// stats daily wins command
const TOTALCOUNT_COMMAND = {
  name: "totalcount",
  description: "Check the total daily wins sent in the GO Youth Discord server",
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
}



const ALL_COMMANDS = [DAILYWINS_COMMAND, TOTALCOUNT_COMMAND];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
