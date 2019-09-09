# chatbot-scripts

## Installation
ℹ️ This package requires node & npm

```
git clone git@github.com:robbyatbabylon/chatbot-script.git
npm install
```

## Usage

```
node app.js {flow_json_file}
```

Where `flow_json_file` is the configuration file with the flows configured. (By default, it's `flow.json`)

You can also run the following command to run against `flow.json`

```
npm start
```

It should print out the question being asked by the chatbot, along with the automated answer.

After it is finished running, a file should appear under the reports directory with the `json` coming back from the diagnostic engine, which is the equivalent of the `View Report` seen in the app.

You can also see this in app by logging in with the specified user, and looking in the Chat History.

## Configuration

To customize to different flows, you can add a new flow in the `flows` array in the configuration file.

The default structure looks like this:
```json
{
  "flows": [
    {
      "user": {
        "email": "{patient_email}",
        "password": "{patient_password}",
        "login_type": "patient"
      },
      "options": {
        "appName": "{app_name}",
        "url": "{env_services_url}",
        "locale": "{language_header}"
      },
      "steps": [
        { "type": "choices", "value": "Continue" },
        { "type": "symptom", "value": "{symptom from symptom selector}" },
        { "type": "choices", "value": "{answer to next question}" },
        { "type": "choices", "value": "{answer to next question}" },
        ...
        { "type": "choices", "value": "{answer to next question}" },
        { "type": "choices", "value": "Continue" }
      ]
    },
    {
      "user": {
        "email": "{patient_email}",
        "password": "{patient_password}",
        "login_type": "patient"
      },
      "options": {
        "appName": "{app_name}",
        "url": "{env_services_url}",
        "locale": "{language_header}"
      },
      "steps": [
        { "type": "choices", "value": "Continue" },
        { "type": "symptom", "value": "{symptom from symptom selector}" },
        { "type": "choices", "value": "{answer to next question}" },
        { "type": "choices", "value": "{answer to next question}" },
        ...
        { "type": "choices", "value": "{answer to next question}" },
        { "type": "choices", "value": "Continue" }
      ]
    }
  ]
}
```
