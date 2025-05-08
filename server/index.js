const express = require('express');
const path = require('path');
const mongoose = require('mongoose')
mongoose.set('strictQuery', false)

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const dbUrl = process.env.MONGO_DB_URL

const schema = new mongoose.Schema({
  value: Number,
})

const Counter = mongoose.model('Counter', schema)

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());

app.get('/api/ping', async (req, res) => {
  res.json({ message: 'pong' });
});

app.get('/api/counter', async (req, res) => {
  const counter = await Counter.findOne()
  res.json(counter);
});

app.post('/api/counter', async (req, res) => {
  const { value } = req.body;
  const counter = await Counter.findOne()
  counter.value = value;
  await counter.save();
  res.json(counter);
})

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
    await mongoose.connect(dbUrl)
    const counters = await Counter.find()
    if (counters.length === 0) {
      await Counter.create({ value: 0 })
      console.log('Initialized counter with value 0')
    } else {
      console.log('Counter already exists')
    }


  } catch (error) {
    console.error('Unable to connect to the database', error);
  }
});