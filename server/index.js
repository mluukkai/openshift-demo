/* eslint-disable no-undef */
const express = require('express');
const path = require('path');
const { Sequelize, DataTypes, Model } = require('sequelize');

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

//gets the user code from the OIDC provider and exchanges it for an access token
app.get('/api/login/callback', async (req, res) => {
  const code = req.query.code;
  const OIDC_SECRET = process.env.OIDC_SECRET;
  const OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID;
  const OIDC_REDIRECT_URI = process.env.OIDC_REDIRECT_URI;
  const OIDC_BASE_URL = process.env.OIDC_BASE_URL;

  const OIDC_TOKEN_ENDPOINT = `${OIDC_BASE_URL }/idp/profile/oidc/token`
  const usertoken = await fetch(OIDC_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      code: code,
      client_id: OIDC_CLIENT_ID,
      client_secret: OIDC_SECRET,
      redirect_uri: OIDC_REDIRECT_URI,
      grant_type: 'authorization_code'
    })
  });

  const OIDC_USERINFO_ENDPOINT = `${OIDC_BASE_URL }/idp/userinfo`

  const userinfo = await fetch(OIDC_USERINFO_ENDPOINT, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${usertoken}`
    }
  });
  
  console.log('userinfo', userinfo);

});

app.get('/api/logout', async (req, res) => {
  res.redirect('/')
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