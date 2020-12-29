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

app.get('/', (req, res) => {
  if (req.cookies.sessionTokenNodusCore === "undefined" || req.cookies.sessionTokenNodusCore === undefined) {
    res.status(304).redirect('/login');
  } else {
    client.query(`SELECT token_user FROM username WHERE id_user='${jwt_decode(req.cookies.sessionTokenNodusCore).sub}'`)
    .then(dbres => {
      if (dbres.rows[0] === undefined) {
        resres.status(305).redirect('/login');
      } else {
        bcrypt.compare(req.cookies.sessionTokenNodusCore, dbres.rows[0].token_user, (err, out) => {
              if (err) {res.status(304).redirect('/login')}
          else {
            if (out) {
              res.status(200).cookie('hcTmp_noduscore', {}, {maxAge: -1}).sendFile(path.join(__dirname + '/index.html'));
            } else {
              res.status(304).redirect('/login');
            }
          }
        }
      )}
    }).catch(e => console.error(e.stack))}
})

app.get('/login', (req,res) => {

  let result = captcha();
  let source = result.image;
  
  let loginHtml =`
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Login</title>
  </head>
  <body>
      <h2>Login</h2>
      <form action="/login" method="post">
          <label for="usr">Username</label><br>
          <input type="text" name="usr" id="usr"><br>
          <label for="psw">Password</label><br>
          <input type="password" name="psw" id="psw"><br>
          <img id="captchaImg" src="${source}" alt="captchaImg"><br>
          <label for="captcha">Enter captcha:</label><br>
          <input type="text" name="captcha" id="captcha"><br>
          <button type="submit" value="Submit">Login</button>
      </form>
  </body>
  </html>
  `

  bcrypt.genSalt(saltRounds, (err, salt) => bcrypt.hash(result.value, salt, (err, hash) => res.status(200).cookie("hcTmp_noduscore", hash, { maxAge: 900000, httpOnly: true }).send(loginHtml)));
  
})

app.get('/register', (req,res) => {

  let result = captcha();
  let source = result.image;
  
  let registerHtml =`
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Register</title>
  </head>
  <body>
      <h2>Register</h2>
      <form action="/register" method="post">
          <label for="usr">Username</label><br>
          <input type="text" name="usr" id="usr"><br>
          <label for="psw">Password</label><br>
          <input type="password" name="psw" id="psw"><br>
          <img id="captchaImg" src="${source}" alt="captchaImg"><br>
          <label for="captcha">Enter captcha:</label><br>
          <input type="text" name="captcha" id="captcha"><br>
          <button type="submit" value="Submit">Register</button>
      </form>
  </body>
  </html>
  `

  bcrypt.genSalt(saltRounds, (err, salt) => bcrypt.hash(result.value, salt, (err, hash) => res.status(200).cookie("hcTmp_noduscore", hash, { maxAge: 900000, httpOnly: true }).send(registerHtml)));
})

app.post('/register', (req, res) => {





  let identity = null;
  let queryTxt =  ` 
  INSERT INTO username(email_user)
    SELECT '${req.body.usr}'
  WHERE NOT EXISTS (
    SELECT 1 FROM username WHERE email_user='${req.body.usr}'
  ) RETURNING id_user;
  `;


  bcrypt.compare(req.body.captcha, req.cookies.hcTmp_noduscore, (err, out) => {
    if (!err && out === true) {
      client.query(queryTxt , (err, dbres) => {
        if (err) {
          console.log(err)
        } else {
          if (dbres.rows[0] === undefined) {
            res.status(300)
            res.send('User alredy exist')
          } else {
            identity = dbres.rows[0].id_user
            bcrypt.genSalt(saltRounds, function(err, salt) {
              bcrypt.hash(req.body.psw, salt, function(err, hash) {
                  client.query(`INSERT INTO password(psw_hash, id_hash) VALUES('${hash}', '${identity}')` , (err) => {
                    if (err) {console.log(err)}
                    else {
                      res.status(200).cookie('hcTmp_noduscore', {}, {maxAge: -1}).redirect('/login')
                    }
                  })
                });
            });
          }
        }
      })
    }
    else if (!err && out === false) {
      res.status(318).send('Wrong captcha or u r a robot')
  }
    else {console.log(err)}
  });


  


})

app.post('/login', (req, res) => {

    bcrypt.compare(req.body.captcha, req.cookies.hcTmp_noduscore, (err, out) => {
      if (!err && out === true) {
        
        client
        .query(`SELECT id_user FROM username WHERE email_user = '${req.body.usr}'`)
        .then(dbres => {
          if (dbres.rows[0] === undefined) {
            res.status(302)
            res.send('User not found')
          } else {
            let dbUserId = dbres.rows[0].id_user;
            client
            .query(`SELECT psw_hash FROM password WHERE id_hash = '${dbUserId}'`)
            .then(dbres => {
              bcrypt.compare(req.body.psw, dbres.rows[0].psw_hash, (err, out) => {
                if (err) {  console.error(err)
                } else {
                  switch (out) {
                    case true:
                      let token = jwt.sign({ sub: dbUserId }, config.secret, { expiresIn: '7d' })
                      bcrypt.genSalt(saltRounds, function(err, salt) {
                        bcrypt.hash(token, salt, function(err, hash) {
                          client.query(`UPDATE username SET token_user='${hash}' WHERE id_user=${dbUserId}`)
                            .then((dbres) => (dbres) ? res.status(200).cookie('sessionTokenNodusCore', token, { maxAge: 900000, httpOnly: true }).redirect('/') : null)
                            .catch(e => console.error(e.stack))
                          });
                      });
                      break;
                    case false:
                      res.status(301)
                      res.send('Password wrong')
                      break;
                    default:
                      console.log('Opzione non prevista')
                      break;
                  }}})
            }).catch(e => console.error(e.stack))
          }}).catch(e => console.error(e.stack))

      } else if (!err && out === false) {
        res.status(318).send('Sorry, but you are a robot!').redirect('/login')
      } else {
        console.log(err);
      }
    });



    }
  )

app.get('/logout', (req, res) => (req) ? res.status(200).cookie('sessionTokenNodusCore', undefined, { maxAge: 900000, httpOnly: true }).redirect('/login') : null)


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`)
})
