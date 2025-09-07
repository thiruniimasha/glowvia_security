import fs from 'fs';
import selfsigned from 'selfsigned';

// Attributes for the certificate
const attrs = [{ name: 'commonName', value: 'localhost' }];

// Generate certificate valid for 1 year
const pems = selfsigned.generate(attrs, { days: 365 });

// Create folder if not exists
fs.mkdirSync('certs', { recursive: true });

// Save cert and key
fs.writeFileSync('certs/cert.pem', pems.cert);
fs.writeFileSync('certs/key.pem', pems.private);

console.log('Self-signed certificate generated at certs/');
