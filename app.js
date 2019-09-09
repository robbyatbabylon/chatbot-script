"use strict";

const fs = require('fs');

const Chatbot = require('./chatbot');

const args = process.argv.slice(2);

if (args.length < 0) {
  console.error('Please pass argument with json of the steps.');
} else {
  fs.readFile(args[0], 'utf8', (err, data) => {
    const flows = JSON.parse(data).flows;

    for (const f of flows) {
      let chatbot = new Chatbot(f.user, f.options);

      chatbot.login().then(() => {
        chatbot.runFlow(f)
      })
      .catch(err => console.error(err));
    }
  });
}
