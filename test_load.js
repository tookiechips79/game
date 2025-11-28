const http = require('http');

http.get('http://localhost:5173/', (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  
  res.on('data', (chunk) => {
    // Log first 500 chars
    const str = chunk.toString();
    if (str.includes('error')) console.log('Found error:', str.substring(0, 500));
  });
}).on('error', (e) => {
  console.error('Connection error:', e.message);
});
