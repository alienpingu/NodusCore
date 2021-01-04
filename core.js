// Express
const express = require('express')
const app = express()
const port = 8080
// Bcrypt
const bcrypt = require('bcrypt');
const saltRounds = 10;
// Bodyparser
var path = require('path');
require('rootpath')();
const cors = require('cors');
const bodyParser = require('body-parser');
// Cookie parser
var cookieParser = require('cookie-parser')
// Recaptcha
var captcha = require("nodejs-captcha");
// Pug visualizer
const pug = require('pug');
app.set('view engine', 'pug');

// JsonWebToken
var jwt = require('jsonwebtoken');
const config = require('config.json'); // CONTENUTI DA METTERE NELLE VARIABILI DI SISTEMA
// JWT Decode
const jwt_decode = require("jwt-decode");
// Framework used from the app
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser())
app.use(cors());
// Node Postgres
const { Client } = require('pg')
var connectionString = "postgresql://postgres:postgres@localhost:5432/postgres"; // CONTENUTI DA METTERE NELLE VARIABILI DI SISTEMA
const client = new Client({
  connectionString
})
client.connect()


// Utils
const utilsGet = require ('./utils/get.js');

const utilsPost = require ('./utils/post.js');

// GET

app.get('/', (req, res) => utilsGet.homeHandler(req, res));

app.get('/login', (req,res) => utilsGet.loginHandler(req, res));

app.get('/register', (req,res) => utilsGet.registerHandler(req, res));

app.get('/account', (req, res) => utilsGet.accountHandler(req, res));

app.get('/logout', (req, res) => utilsGet.logoutHandler(req, res));

app.get('/vendors', (req, res) => utilsGet.vendorsHandler(req, res));

app.get('/shop', (req, res) => utilsGet.shopHandler(req, res));

app.get('/product', (req, res) => utilsGet.productHandler(req, res));

// POST

app.post('/register', (req, res) => utilsPost.registerHandler(req, res));

app.post('/login', (req, res) => utilsPost.loginHandler(req, res));

app.post('/account', (req, res) => utilsPost.accountHendler(req, res));

app.listen(port, () => {

  console.log(`Server listening at http://localhost:${port}`)

})
