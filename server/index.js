const express = require('express');
const path = require('path');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

console.log(process.env.DB_URL)

const PORT = process.env.PORT || 3000;
const app = express();

let counter = 1;
app.use(express.json());

app.get('/api/counter', (req, res) => {
  res.json({ counter });
});

app.post('/api/counter', (req, res) => {
  const { value } = req.body;

  counter = value;

  res.json({ counter });
})

// jos ollaan tuotannossa, tarjotaan dist-hakemistoon käännetty frontend sovelluksen juuriosoiteessa
if (process.env.NODE_ENV === 'production') {
  const DIST_PATH = path.resolve(__dirname, '../dist')

  const INDEX_PATH = path.resolve(DIST_PATH, 'index.html')
  app.use(express.static(DIST_PATH))
  app.get('/*any', (_, res) => res.sendFile(INDEX_PATH))
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});