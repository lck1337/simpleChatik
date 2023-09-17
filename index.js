const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = 3001;

const http = require('http');
const server = http.createServer(app);

const fs = require('fs/promises');
const socket = require('./ws-server/index');
const db = require('./database/index.js');
const user = require('./userService.js');
const database = new db({
  ip: '0.0.0.0',
  port: 3306,
  user: 'DBuser',
  pass: 'password123',
  dbname: 'testik'
});

const userService = new user(database);

const socketIO = new socket({
  server, userService, database
});

(async () => {
  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  const routes = await fs.readdir('./api');

  routes.map(async (file) => {
    const route = require(`./api/${file}`);
    app[route.method](route.path, async (req, res, next) => {
      await route.execute(req, res, next, userService, socketIO);
    });
  });
  

  server.listen(port, () => {
    console.log(`Приложуха фурычит на порту: ${port}`);
  });
})();
