const fetch = require('node-fetch');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const defaultOptions = {
  appName: 'babylon_us',
  url: 'https://services.us.preprod.babylontech.co.uk',
  locale: 'en-US'
};

class Chatbot {
  get headers() {
    return (
      {
        'X-App-Name': this.appName,
        'Accept-Language': this.locale,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.kongToken}`,
        'If-Match': this.etag
      }
    );
  }

  getConversation() {
    return this.conversation;
  }

  getDiagId() {
    this.diagId = this.conversation.slice(-1)[0].messages.slice(-1)[0].value.id;
    return this.diagId;
  }

  constructor(user, options = defaultOptions) {
    this.appName = options.appName;
    this.baseUrl = options.url;
    this.locale = options.locale;
    this.user = user;

    this.conversation = [];

    if (!fs.existsSync('./reports')) {
      fs.mkdirSync('./reports');
    }
  }

  async login() {
    const token = fs.readFileSync('./token', 'utf8');
    if (token && Date.now() < (jwt.decode(token).exp * 1000)) {
      this.kongToken = token;
      return new Promise(resolve => resolve(token));
    } else {
      return new Promise((resolve, reject) => {
        fetch(`${this.baseUrl}/ai-auth/v1/login`,
          {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(this.user)
          })
          .then(res => res.json())
          .then(json => {
            this.kongToken = json.kong.access_token;
            fs.writeFileSync('./token', this.kongToken);
            resolve(this.kongToken);
          })
          .catch(error => console.error('Error:', error));
      });
    }
  }

  async startConversation() {
    return new Promise((resolve, reject) => {
      fetch(`${this.baseUrl}/chatscript/v3/conversations`,
        {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({})
        })
        .then(res => {
          this.etag = res.headers.get('etag');
          return res.json();
        })
        .then(res => {
          this.conversationId = res.conversation.id;
          this.conversation.push(res);
          resolve(res.messages.slice(-1)[0].value.text);
        })
        .catch(error => console.error('Error:', error));
    })
  }

  async say(type, value) {
    if (type == 'choices') {
      const c = this.conversation.slice(-1)[0]
        .messages.slice(-1)[0]
        .input.params.choices.filter(e => e.label == value)[0];
      return new Promise((resolve, reject) => {
        fetch(`${this.baseUrl}/chatscript/v3/conversations/${this.conversationId}/say`,
          {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify({
              value : {
                choices : [
                  {
                    id : c.id
                  }
                ]
              },
              type : 'choices'
            })
          })
          .then(res => {
            this.etag = res.headers.get('etag');
            return res.json();
          })
          .then(json => {
            this.conversation.push(json);
            resolve(json.messages.slice(-1)[0].value.text);
          })
          .catch(error => console.error('Error:', error));
      });
    } else if (type == 'symptom') {
      const suggestions = await this.suggest(value);
      return new Promise((resolve, reject) => {
        fetch(`${this.baseUrl}/chatscript/v3/conversations/${this.conversationId}/say`,
          {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify({
              value : {
                id: suggestions[0].value.id,
                text: suggestions[0].value.text
              },
              type : 'symptom'
            })
          })
          .then(res => {
            this.etag = res.headers.get('etag');
            return res.json();
          })
          .then(json => {
            this.conversation.push(json);
            resolve(json.messages.slice(-1)[0].value.text);
          })
          .catch(error => console.error('Error:', error));
      });
    }
  }

  async suggest(symptom) {
    return new Promise((resolve, reject) => {
      fetch(`${this.baseUrl}/chatscript/v3/conversations/${this.conversationId}/suggest`,
        {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({query: symptom})
        })
        .then(res => res.json())
        .then(json => {
          resolve(json);
        })
        .catch(error => console.error('Error:', error));
    });
  }

  async runFlow(flow) {
    this.startConversation().then(async (r) => {
      let res = r;
      console.log(`Chatbot Asked: ${res}`);

      for (const s of flow.steps) {
          console.log(`We Answered: ${s.value}`);
          res = await this.say(s.type, s.value);
          console.log(`Chatbot Asked: ${res}`);
      }

      console.log(this.getDiagId())
      this.report()
        .then((text) => (fs.writeFileSync(`./results/report_${this.getDiagId()}.json`, text)));
    });
  }

  async report() {
    return new Promise((resolve, reject) => {
      fetch(`${this.baseUrl}/diagnostic-engine/v2/outcomes/${this.diagId}/summary`,
        {
          method: 'GET',
          headers: this.headers,
        })
        .then(res => res.text())
        .then(text => {
          resolve(text);
        })
        .catch(error => console.error('Error:', error));
    });
  }
}

module.exports = Chatbot;
