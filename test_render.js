const https = require('https');

https.get('https://scann-cr.onrender.com', (res) => {
  console.log('STATUS:', res.statusCode);
  res.on('data', (d) => process.stdout.write(d));
}).on('error', (e) => {
  console.error('ERROR:', e);
});
