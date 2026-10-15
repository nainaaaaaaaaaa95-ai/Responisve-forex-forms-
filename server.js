const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Load currencies from local file
const currenciesPath = path.join(__dirname, 'data', 'currencies.json');
let currencies = {};
try {
  currencies = JSON.parse(fs.readFileSync(currenciesPath, 'utf8'));
} catch (err) {
  console.error('Error reading currencies.json:', err);
}

// Home route (GET)
app.get('/', (req, res) => {
  res.render('index', {
    currencies,
    from: 'INR',
    to: 'USD',
    amount: '',
    rate: null,
    result: null,
    error: null
  });
});

// Handle form submission (POST)
app.post('/convert', async (req, res) => {
  const { from, to, amount } = req.body;
  let rate = null;
  let result = null;
  let error = null;

  if (!from || !to || !amount || isNaN(amount)) {
    error = 'Please fill all fields with valid values.';
  } else {
    try {
      // Use a free API that doesn't require authentication
      const rateUrl = `https://open.er-api.com/v6/latest/${from}`;
      console.log('Fetching from:', rateUrl);
      
      const rateResponse = await axios.get(rateUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Currency-Exchange-App/1.0'
        }
      });
      
      console.log('API Response:', JSON.stringify(rateResponse.data, null, 2));
      
      if (rateResponse.data && rateResponse.data.rates && rateResponse.data.rates[to]) {
        rate = rateResponse.data.rates[to];
        result = (parseFloat(amount) * rate).toFixed(2);
      } else {
        error = 'Could not fetch exchange rate.';
      }
    } catch (err) {
      console.error('API Error:', err.message);
      error = 'Error fetching exchange rate. Please try again.';
    }
  }

  res.render('index', {
    currencies,
    from,
    to,
    amount,
    rate,
    result,
    error
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});