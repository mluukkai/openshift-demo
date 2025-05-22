const express = require('express');
const path = require('path');
const { Sequelize, DataTypes, Model } = require('sequelize');
const cors = require('cors');
const { RedisStore } = require("connect-redis")
const Redis = require("ioredis");

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

// ----

const passport = require('passport')
const session = require('express-session')

const SESSION_SECRET = process.env.SESSION_SECRET
const REDIS_HOST = process.env.REDIS_HOST

const redis = new Redis({
  host: REDIS_HOST,
  port: 6379,
})

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new RedisStore({ client: redis }),
}))

app.use(passport.initialize())
app.use(passport.session())

// ----

app.use(cors());
app.use(express.json());
app.use(express.json());

// jos ei olla tuotannossa, feikataan käyttäjä

let loggedIn = false

if (process.env.NODE_ENV !== 'production') {
  const setMocUser = (req, res, next) => {
    if (!loggedIn) {
      return next()
    }

    req.user = {
      "id": "2Q6XGZP4DNWAEYVIDZV2KLXKO3Z4QEBM",
      "username": "mluukkai-test",
      "name": "Matti Luukkainen"
    }
    next()
  }
  
  app.use(setMocUser)

  app.get('/api/login', (req, res) => {
    loggedIn = true
    res.redirect('/');
  })

  app.post('/api/logout', (req, res, next) => {
    loggedIn = false
    res.redirect('/');
  });
}

// feikkikirjaantumisen koodi loppuu

app.get('/api/login', passport.authenticate('oidc'))

app.get('/api/login/callback', passport.authenticate('oidc', { failureRedirect: '/' }), async (req, res) => {
  res.redirect('/')
})

app.post('/api/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

app.get('/api/user', async (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
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

// jos ollaan tuotannossa, tarjotaan dist-hakemistoon käännetty frontend sovelluksen juuriosoiteessa
if (process.env.NODE_ENV === 'production') {
  const DIST_PATH = path.resolve(__dirname, '../dist')

  const INDEX_PATH = path.resolve(DIST_PATH, 'index.html')
  app.use(express.static(DIST_PATH))
  app.get('/*any', (_, res) => res.sendFile(INDEX_PATH))
}

app.listen(PORT, async () => {
  const { setupAuthentication }  = await import('./oicd.mjs');

  await setupAuthentication()
  console.log(`Server (passport login) running on http://localhost:${PORT}`);
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