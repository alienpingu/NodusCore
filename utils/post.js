// Bcrypt
const bcrypt = require('bcrypt');
const saltRounds = 10;
// Postgres
const { Client } = require('pg')
var connectionString = "postgresql://postgres:postgres@localhost:5432/postgres"; // CONTENUTI DA METTERE NELLE VARIABILI DI SISTEMA
const client = new Client({
  connectionString
})
client.connect()
// JavascriptWebToken
var jwt = require('jsonwebtoken');
const config = require('config.json'); // CONTENUTI DA METTERE NELLE VARIABILI DI SISTEMA


function registerHandler(req, res) {
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
}

function loginHandler(req, res) {
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
            res.status(318).cookie('hcTmp_noduscore', {}, {maxAge: -1}).redirect('/login');
        } else {
          console.log(err);
        }
      });  
}

module.exports = {
    loginHandler,
    registerHandler
};