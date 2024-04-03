const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Hello from App Engine!');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
});

/* Firebase
const { initializeApp } = require('firebase-admin/app')
const app = initializeApp()
*/

/* Example Application
const { createServer } = require('node:http');

const hostname = '127.0.0.1';
const port = 3000;

const server = createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello World');
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
*/
