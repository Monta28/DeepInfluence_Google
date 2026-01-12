require('dotenv').config();
const jwt = require('jsonwebtoken');

const apiKey = process.env.VIDEOSDK_API_KEY;
const secretKey = process.env.VIDEOSDK_SECRET_KEY;

const token = jwt.sign(
  { apikey: apiKey },
  secretKey,
  { expiresIn: '24h', algorithm: 'HS256' }
);

console.log('Token:', token);

fetch('https://api.videosdk.live/v2/recordings', {
  headers: { 'Authorization': token }
})
.then(r => r.json())
.then(data => {
  console.log('\n=== ENREGISTREMENTS VideoSDK ===');
  console.log('Total:', data?.data?.length || 0);
  if (data?.data && data.data.length > 0) {
    console.log('\nPremier enregistrement:');
    console.log(JSON.stringify(data.data[0], null, 2));
  } else {
    console.log('\nAucun enregistrement trouvé');
    console.log('Réponse complète:', JSON.stringify(data, null, 2));
  }
})
.catch(err => console.error('Erreur:', err));