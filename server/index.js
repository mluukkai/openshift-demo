/* eslint-disable no-undef */
const express = require('express');
const path = require('path');
const { Sequelize, DataTypes, Model } = require('sequelize');
const axios = require('axios');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const dbUrl = process.env.DB_URL
const sequelize = new Sequelize(dbUrl);

class Counter extends Model {}

Counter.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  value: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
}, {
  sequelize,
  underscored: true,
  timestamps: false,
  modelName: 'counter'
})

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());

app.get('/api/ping', async (req, res) => {
  res.json({ message: 'pong' });
});

app.get('/api/counter', async (req, res) => {
  const counter = await Counter.findOne();
  res.json(counter);
});

app.post('/api/counter', async (req, res) => {
  const { value } = req.body;

  const counter = await Counter.findOne();
  counter.value = value;
  await counter.save();

  res.json({ value: counter });
})

// gets the user code from the OIDC provider and exchanges it for an access token
app.get('/api/login/callback', async (req, res) => {
  const code = req.query.code;
 
  console.log('----------')
  console.log('/api/login/callback')

  console.log('code', code);

  try {  
    //gets the user code from the OIDC provider and exchanges it for an access token

  const OIDC_SECRET = process.env.OIDC_CLIENT_SECRET;
  const OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID;

  // the redirect uri is the same as the one used in the login request
  // It is required in the token request due to security reasons read: https://stackoverflow.com/questions/29653421/why-does-oauth-rfc-require-the-redirect-uri-to-be-passed-again-to-exchange-code
  const OIDC_REDIRECT_URI = process.env.OIDC_REDIRECT_URI;

  
  // The values for the token endpoint and userinfo endpoint are from https://login.helsinki.fi/.well-known/openid-configuration
  // They could also be fetched during runtime, but in this demo they are defined in the environment variables.
  // Token endpoint gives an access token and needs the client id, secret and user code for authentication
  const OIDC_TOKEN_ENDPOINT = process.env.OIDC_TOKEN_ENDPOINT; 
  const usertoken = await fetch('https://login-test.it.helsinki.fi/idp/profile/oidc/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code: code,
      client_id: OIDC_CLIENT_ID,
      client_secret: OIDC_SECRET,
      redirect_uri: OIDC_REDIRECT_URI,
      grant_type: 'authorization_code'

    })
  });
  console.log(usertoken);
  console.log('usertoken', usertoken.body);
  const tokenData = await usertoken.json();
  console.log('tokenData', tokenData);
  //Userinfo endpoint gives the user information and needs an user token for authentication  
  const OIDC_USERINFO_ENDPOINT = process.env.OIDC_USERINFO_ENDPOINT; 
  const userinfo = await fetch('https://login-test.it.helsinki.fi/idp/profile/oidc/userinfo', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${tokenData}`
    }
  });
  
  console.log('userinfo', userinfo);


    /*
    console.log('----------')

    const body = new URLSearchParams({
      code: code,
      client_id: OIDC_CLIENT_ID,
      client_secret: OIDC_SECRET,
      redirect_uri: OIDC_REDIRECT_URI,
      grant_type: 'authorization_code'
    }).toString();

    console.log('body', body);

    const tokenResponse = await fetch('https://login-test.it.helsinki.fi/idp/profile/oidc/token', {
      method: 'POST',
      headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body
    });

    console.log('----------')

    console.log('tokenResponse', tokenResponse);

    console.log('----------')
   
    const tokenData = await tokenResponse.json();

    console.log('tokenData', tokenData);
    
    /*                  
    const result = await axios.post(`https://login-test.it.helsinki.fi/idp/profile/oidc/token`, {
        grant_type: 'authorization_code',   
        code: code,
        client_id: OIDC_CLIENT_ID,
        client_secret: OIDC_SECRET,
        redirect_uri:OIDC_REDIRECT_URI  
      },
      {
        headers:{ 
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    )
    console.log(result)

    const usertoken = tokenData.access_token;

    console.log('usertoken', usertoken);
    /*
    const OIDC_USERINFO_ENDPOINT = `${OIDC_BASE_URL}/idp/userinfo`

    const userinfo = await fetch(OIDC_USERINFO_ENDPOINT, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${usertoken}`
      }
    });
  
    console.log('userinfo', userinfo);
    */
  } catch (e) {
    console.log('----------')
    console.log(e)
  }

});

app.get('/api/login', async (req, res) => {
  const OIDC_BASE_URL = process.env.OIDC_BASE_URL;
  const OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID;
  const OIDC_REDIRECT_URI = process.env.OIDC_REDIRECT_URI;

  console.log('/api/login')

  const authorizeUrl = `https://login-test.it.helsinki.fi/idp/profile/oidc/authorize?response_type=code&client_id=${encodeURIComponent(OIDC_CLIENT_ID)}&redirect_uri=${encodeURIComponent(OIDC_REDIRECT_URI)}&scope=openid%20profile%20uid%20name`;

  console.log('redirecting to', authorizeUrl);

  res.redirect(authorizeUrl);
});

app.get('/api/logout', async (req, res) => {
  res.redirect('/')
});

app.get('/api/user', async (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

// jos ollaan tuotannossa, tarjotaan dist-hakemistoon käännetty frontend sovelluksen juuriosoiteessa
if (process.env.NODE_ENV === 'production') {
  const DIST_PATH = path.resolve(__dirname, '../dist')

  const INDEX_PATH = path.resolve(DIST_PATH, 'index.html')
  app.use(express.static(DIST_PATH))
  app.get('/*any', (_, res) => res.sendFile(INDEX_PATH))
}

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  try {
    console.log('Connecting to the database in', dbUrl);
    await sequelize.authenticate();
    console.log('Connected to the database');
    await Counter.sync()
      .then(() => {
        console.log('Counter table exists or has been created');
      })
      .catch((error) => {
        console.error('Unable to create table:', error);
      });

    const count = await Counter.count();
    if (count === 0) {
      await Counter.create({ value: 0 });
      console.log('Initialized counter with value 0');
    }
  } catch (error) {
    console.error('Unable to connect to the database', error);
  }
});