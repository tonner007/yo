/**
 * Test přístupu k Vite serveru z různých hostů
 */

const http = require('http');

const testHosts = [
  { name: 'localhost', host: 'localhost:3000', headers: { Host: 'localhost' } },
  { name: 'tonner.my.id', host: 'localhost:3000', headers: { Host: 'tonner.my.id' } },
  { name: '127.0.0.1', host: '127.0.0.1:3000', headers: { Host: '127.0.0.1' } },
  { name: 'cizidomena.com', host: 'localhost:3000', headers: { Host: 'cizidomena.com' } }
];

console.log('🧪 Testování přístupu k Vite serveru na portu 3000\n');

testHosts.forEach((test) => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/',
    method: 'GET',
    headers: test.headers
  };

  const req = http.request(options, (res) => {
    console.log(`✅ ${test.name}: HTTP ${res.statusCode} - Povoleno`);
  });

  req.on('error', (err) => {
    if (err.code === 'ECONNREFUSED') {
      console.log(`❌ ${test.name}: Server není dostupný`);
    } else {
      console.log(`❌ ${test.name}: Chyba - ${err.message}`);
    }
  });

  req.setTimeout(3000, () => {
    console.log(`⏰ ${test.name}: Timeout`);
    req.destroy();
  });

  req.end();
});

// Test přímého curl příkazu
console.log('\n🔧 Test přes curl:');
console.log('curl -H "Host: tonner.my.id" http://localhost:3000');
console.log('curl -H "Host: localhost" http://localhost:3000');