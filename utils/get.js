// Recaptcha
var captcha = require("nodejs-captcha");
// Bcrypt
const bcrypt = require('bcrypt');
const saltRounds = 10;
// JsonWebToken
const jwt_decode = require("jwt-decode");
// Path 
var path = require('path');
// Node Postgres
const { Client } = require('pg')
var connectionString = "postgresql://postgres:postgres@localhost:5432/postgres"; // CONTENUTI DA METTERE NELLE VARIABILI DI SISTEMA
const client = new Client({
  connectionString
})
client.connect()

// FUNCTIONS

function authRender(req, res, path, config) {

    if (req.cookies.sessionTokenNodusCore === "undefined" || req.cookies.sessionTokenNodusCore === undefined) {
        res.status(401).cookie('hcTmp_noduscore', {}, {maxAge: -1}).redirect('/login');
        // No token
        return false
      } else {

        let tmpId = jwt_decode(req.cookies.sessionTokenNodusCore).sub;
        client.query(`SELECT token_user,wik_user,email_user FROM username WHERE id_user='${tmpId}'`)
            .then(dbres => {
                if (dbres.rows[0] === undefined) {
                        // No token in db
                        res.status(401).cookie('hcTmp_noduscore', {}, {maxAge: -1}).redirect('/login');
                } else {


                    // Update config with user information
                    config.wik = dbres.rows[0].wik_user;
                    config.id = tmpId;
                    config.email = dbres.rows[0].email_user;

                    bcrypt.compare(req.cookies.sessionTokenNodusCore, dbres.rows[0].token_user, (err, out) => 
                    {
                        if (err) {
                                //Wrong token   
                                res.status(301).cookie('hcTmp_noduscore', {}, {maxAge: -1}).redirect('/login');
                        }   else    {
                                if (out) {
                                    // OK: Trust token
                                    console.log(config.titlePage,config.wik, config.id, config.email);

                                    res.status(200).cookie('hcTmp_noduscore', {}, {maxAge: -1}).render(path, config);
                                } else {
                                    // NO: Invalid token
                                    res.status(302).cookie('hcTmp_noduscore', {}, {maxAge: -1}).redirect('/login');
                                    return false
                                }
                        }
                    }
                )}
                }).catch(e => console.error(e.stack))
    }
} 

function logoutHandler(req, res) {
    if (req) {
        res
            .status(200)
            .cookie('sessionTokenNodusCore', {}, { maxAge: -1, httpOnly: true })
            .redirect('/login');
    }
};

function accountHandler(req, res)  {


    let config = {
        titlePage: "Account"
    };

    authRender(req, res, 'account', config);

};

function loginHandler(req, res) {
    let result = captcha();
    let source = result.image;
    
    bcrypt.genSalt(saltRounds, (err, salt) => bcrypt.hash(result.value, salt, (err, hash) => {
        res
        .status(200)
        .cookie("hcTmp_noduscore", hash, { 
            maxAge: 900000, 
            httpOnly: true 
        })
        .render('form', { 
            titlePage: 'Login', 
            message: '/login',
            captchaSrc: source
        });
        }
    ));
}

function registerHandler(req, res) {
    let result = captcha();
    let source = result.image;
    
    bcrypt.genSalt(saltRounds, (err, salt) => bcrypt.hash(result.value, salt, (err, hash) => {
      res
        .status(200)
        .cookie("hcTmp_noduscore", hash, { 
          maxAge: 900000, 
          httpOnly: true 
        })
        .render('form', { 
          titlePage: 'Register', 
          message: '/register',
          captchaSrc: source
        });
      }
    ));
}

function homeHandler (req, res) {

    let config = {
        titlePage: "Home!"
    };

    authRender(req, res, 'home', config);
};


function vendorsHandler (req, res) {

    client
        .query("SELECT id_user, wik_user,email_user FROM USERNAME WHERE wik_user IS NOT NULL")
        .then(dbres => {
            res.status(200).render('vendors', {
                titlePage: "Vendors",
                data: dbres.rows
            });
        })
        .catch(e => console.error(e.stack))
}


function shopHandler (req, res) {

    res.status(200).send("OK")
}

function productHandler (req, res) {

        let setting = {
            titlePage:"Product"
        }

        client
            .query("SELECT id_pr, name_pr, desc_pr, price_pr, id_vend FROM product")
            .then(dbres => {
                setting.data = dbres.rows;
                console.log(setting.data);
                authRender(req, res, 'product', setting);
            })
            .catch(e => console.error(e.stack))

    

}

module.exports = {
    logoutHandler,
    accountHandler,
    loginHandler,
    registerHandler,
    homeHandler,
    vendorsHandler,
    shopHandler,
    productHandler

};

