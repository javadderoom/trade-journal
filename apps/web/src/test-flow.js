const axios = require('axios');

async function main() {
  const registerUrl = 'http://127.0.0.1:3000/api/auth/register';
  const tradesUrl = 'http://127.0.0.1:3000/api/trades';

  const userCreds = {
    name: 'Reza Alavi',
    email: `test_flow_diag_${Date.now()}@example.com`,
    phone: '0912' + Math.floor(1000000 + Math.random() * 9000000),
    password: 'Password123'
  };

  try {
    console.log('1. Registering user...');
    const regRes = await axios.post(registerUrl, userCreds, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('Register status:', regRes.status);
    const token = regRes.data.accessToken;
    console.log('Access Token exists:', !!token);

    console.log('\n2. Calling protected /api/trades with token...');
    const tradesRes = await axios.get(tradesUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Trades list status:', tradesRes.status);
    console.log('Trades list keys:', Object.keys(tradesRes.data));
    console.log('Successful flow verified!');

  } catch (err) {
    console.error('Flow failed!');
    if (err.response) {
      console.error('Error STATUS:', err.response.status);
      console.error('Error BODY:', err.response.data);
    } else {
      console.error('Error MESSAGE:', err.message);
    }
  }
}

main();
