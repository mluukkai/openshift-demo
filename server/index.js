/* eslint-disable no-undef */
const express = require('express');
const path = require('path');
const { Sequelize, DataTypes, Model } = require('sequelize');
const axios = require('axios');
const session = require('express-session');

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

// session for remembering the user

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: process.env.NODE_ENV !== 'production',
  cookie: { secure: false } 
}));

// middleware to set the user in the request object if it exists in the session

app.use((req, res, next) => {
  req.user = req.session.user || null;
  next()
});

app.get('/api/user', async (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.user = null;
  res.redirect('/');
});

app.get('/api/login', async (req, res) => {
  const OIDC_BASE_URL = process.env.OIDC_BASE_URL;
  const OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID;
  const OIDC_REDIRECT_URI = process.env.OIDC_REDIRECT_URI;

  // Using the scopes defined in configuration
  const scopes = ['openid', 'email', 'offline_access', 'profile'];

  // Using the claims parameter defined in configuration
  const claims = {
    id_token: {
      cn: null,
      email: null,
      family_name: null,
      given_name: null,
      hyGroupCn: null,
      name: null,
      uid: null
    },
    userinfo: {
      cn: null,
      email: null,
      family_name: null,
      given_name: null,
      hyGroupCn: null,
      name: null,
      uid: null
    }
  };

  const authorizeUrl = `${OIDC_BASE_URL}/idp/profile/oidc/authorize?response_type=code&client_id=${encodeURIComponent(OIDC_CLIENT_ID)}&redirect_uri=${encodeURIComponent(OIDC_REDIRECT_URI)}&scope=${encodeURIComponent(scopes.join(' '))}&claims=${encodeURIComponent(JSON.stringify(claims))}`;

  res.redirect(authorizeUrl);
});


// gets the user code from the OIDC provider and exchanges it for an access token
app.get('/api/login/callback', async (req, res) => {
  console.log('using custom callback url');
  //gets the user code from the OIDC provider and exchanges it for an access token
  const OIDC_SECRET = process.env.OIDC_CLIENT_SECRET;
  const OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID;

  // the redirect uri is the same as the one used in the login request
  // It is required in the token request due to security reasons read: https://stackoverflow.com/questions/29653421/why-does-oauth-rfc-require-the-redirect-uri-to-be-passed-again-to-exchange-code
  const OIDC_REDIRECT_URI = process.env.OIDC_REDIRECT_URI;

  // The values for the token endpoint and userinfo endpoint are from https:///login-test.it.helsinki.fi/.well-known/openid-configuration
  // They could also be fetched during runtime, but in this demo they are defined in the environment variables.
  // Token endpoint gives an access token and needs the client id, secret and user code for authentication

  const OIDC_TOKEN_ENDPOINT = `${process.env.OIDC_BASE_URL}/idp/profile/oidc/token`;
  const tokens = await exchangeCodeClientSecretBasic(OIDC_TOKEN_ENDPOINT, req.query.code, OIDC_CLIENT_ID, OIDC_SECRET, OIDC_REDIRECT_URI);

  const access_token = tokens.access_token;

  // Userinfo endpoint gives the user information and needs an user token for authentication  
  const OIDC_USERINFO_ENDPOINT = `${process.env.OIDC_BASE_URL}/idp/profile/oidc/userinfo`;
  const userinfo_request = await axios.get(OIDC_USERINFO_ENDPOINT, {
    headers: {
    'Authorization': `Bearer ${access_token}`
    }
  });
  
  req.session.user = userinfo_request.data;

  res.redirect('/');
});

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



const exchangeCodeClientSecretPost = async (endpoint, code, client_id, client_secret, redirect_uri) => {
  const request = await axios.post(endpoint, 
    new URLSearchParams({
      code: code, // the user code received from the OIDC provider
      client_id: client_id,
      client_secret: client_secret,
      redirect_uri: redirect_uri,
      grant_type: 'authorization_code'
    }).toString(),
    {
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }
  );
  const access_token = request.data.access_token;
  const id_token = request.data.id_token;
  

  return {
    access_token,
    id_token
  }
}



const exchangeCodeClientSecretBasic= async (endpoint, code, client_id, client_secret, redirect_uri) => {
  const authHeader = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
  const request = await axios.post(endpoint, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`
      },
      body: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      }
  })
  
  const access_token = request.data.access_token;
  const id_token = request.data.id_token;
  
  return {
    access_token,
    id_token
  }
}




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