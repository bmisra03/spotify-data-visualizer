require('dotenv').config();

const axios = require('axios');
const querystring = require('querystring');
const crypto = require('crypto');
const fs = require('fs');
const dotenv = require('dotenv');

let stateKey = 'spotify_auth_state';
let client_id = process.env.CLIENT_ID;
let client_secret = process.env.CLIENT_SECRET;
let redirect_uri = process.env.REDIRECT_URI;

const generateRandomString = (length) => {
    return crypto
    .randomBytes(60)
    .toString('hex')
    .slice(0, length);
}


const login = (req, res) => {
    let state = generateRandomString(16);
    let scope = 'user-read-private user-top-read user-read-email';

    res.cookie(stateKey, state);

    let url = 'https://accounts.spotify.com/authorize?';
    let params = {
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state
    };

    res.redirect(url+querystring.stringify(params));
}

const callback = (req, res) => {
    let code = req.query.code || null;
    let state = req.query.state || null;
    let storedState = req.cookies ? req.cookies[stateKey] : null;
  
    if (state === null || state !== storedState) {
        res.redirect('/#' +
            querystring.stringify({
            error: 'state_mismatch'
        }));
    } else {
        res.clearCookie(stateKey);

        let url =  'https://accounts.spotify.com/api/token';
        let params = {
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirect_uri
        };
        let headers = {
            headers: {
                'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64')),
                'content-type': 'application/x-www-form-urlencoded'
            }
        };

        axios.post(url, params, headers)
        .then((response) => {
            if (response.status === 200){
                res.json(response.data);
            }
        })
        .catch((error) => {
            res.json(error.data);
        });
    }
}

const refresh_token = (req, res) => {
    let refresh_token = req.query.refresh_token;

    let url = 'https://accounts.spotify.com/api/token';
    let params = {
        grant_type: 'refresh_token',
        refresh_token: refresh_token
    };
    let headers = {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64'))
        }
    };

    axios.post(url, params, headers)
    .then((response) => {
        if (response.status === 200){
            const envConfig = dotenv.parse(fs.readFileSync('../.env'));
            envConfig.ACCESS_TOKEN = response.data.access_token;
            envConfig.REFRESH_TOKEN = response.data.refresh_token;
            fs.writeFileSync('../.env', dotenv.stringify(envConfig));
            res.json(response.data);
        }
    })
    .catch((error) => {
        res.json(error.data);
    });
}
  
  

module.exports = { login, callback, refresh_token };