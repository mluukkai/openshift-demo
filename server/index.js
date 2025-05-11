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

// ----

const passport = require('passport')
const session = require('express-session')

const SESSION_SECRET         = process.env.SESSION_SECRET || '1234'

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true }
}))

app.use(passport.initialize())
app.use(passport.session())

// ----

app.use(express.json());

app.get('/api/login', passport.authenticate('oidc'))

app.get('/api/login/callback', passport.authenticate('oidc', { failureRedirect: '/' }), async (req, res) => {
  res.redirect('/')
})

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

  console.log(setupAuthentication)

  await setupAuthentication()
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