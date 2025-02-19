# SummerBodyBot

SummerBodyBot is a Telegram bot designed to track and record competition scores among Aalto guilds and within teams. Participants can register, join or create teams, log weekly activities to earn points, and view various rankings and statistics. The bot is free to use and its functionality may be updated or modified at any time.

## Core Stack

- **Node.js** – [nodejs.org](http://nodejs.org/)
- **Telegraf** – [telegraf.js.org](https://telegraf.js.org/#/)
- **MongoDB** – [mongodb.github.io/node-mongodb-native](https://mongodb.github.io/node-mongodb-native/)
- **Docker** – [docs.docker.com](https://docs.docker.com/get-docker/)

## Quick Start

Clone the repository and install dependencies:

```bash
git clone https://github.com/YourUsername/summer-body-bot.git
cd summer-body-bot
```

Build the Docker image:

```bash
sudo docker build -t summer-body-bot .
```

Start the server (or run locally):

```bash
sudo docker run -d --name summer-body-bot summer-body-bot
```

Stop the server:

```bash
sudo docker stop summer-body-bot
```

Run tests (tester apps):

```bash
// TODO
```

## Project Structure

```
.
├── .github
│   └── workflows
│       └── deploy.yml             # GitHub Actions workflow for deployment
├── bot.js                         # Telegram bot setup and middleware
├── config.js                      # Configuration settings (env variables, etc.)
├── database.js                    # MongoDB connection and configuration
├── deploy-script.sh               # Script to deploy the bot via Docker
├── Dockerfile                     # Docker configuration file
├── flows                          # Conversation flows for the bot
│   ├── information-flows
│   │   ├── help.js
│   │   ├── how-to-points.js
│   │   ├── start.js
│   │   ├── stats-info.js
│   │   └── terms.js
│   ├── statistics-flows
│   │   ├── guild-comparison.js
│   │   ├── guild-standings.js
│   │   ├── team-member-rankings.js
│   │   ├── team-rankings.js
│   │   └── top-users.js
│   ├── create-team.js
│   ├── delete-user.js
│   ├── join-team.js
│   ├── register.js
│   └── week-scores.js
├── models                         # Mongoose models for the application
│   ├── team-model.js
│   └── user-model.js
├── services                       # Business logic services
│   ├── point-service.js
│   ├── team-service.js
│   └── user-service.js
└── utils                          # Utility functions and shared code
    ├── can-add-points.js
    ├── check-private.js
    ├── exit-on-text.js
    ├── format-list.js
    ├── is-comp-active.js
    ├── schedule-reminders.js
    ├── texts.js
    └── validate-team-name.js
```

## License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
