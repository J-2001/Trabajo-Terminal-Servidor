/* Firebase Admin SDK */
const { initializeApp } = require('firebase-admin/app');
const admin = initializeApp();

/* Google Cloud Storage */
const bucketName = process.env.GCLOUD_STORAGE_BUCKET;
console.log(bucketName);
const filePath = '/tmp/';
const fileName = 'tokens.txt';

const {Storage} = require('@google-cloud/storage');
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  keyFileName: "trabajo-terminal-servidor-0b12ed3146c9.json",
});
const path = require('node:path');

async function checkFile() {
    return await storage.bucket(bucketName).file(fileName).exists();
}

async function uploadFile() {
    const options = {
        destination: fileName,
    };
    
    await storage.bucket(bucketName).upload(path.join(filePath, fileName), options);
    console.log(`${fileName} uploaded to ${bucketName}`);
}

async function downloadFile() {
    const options = {
        destination: path.join(filePath, fileName),
    };
    await storage.bucket(bucketName).file(fileName).download(options);
    console.log(`gs://${bucketName}/${fileName} downloaded to ${filePath}`);
}

/* Express */
const express = require('express');
const app = express();

app.get('/', (req, res) => {
    let answer = 'Hello from App Engine!';
    answer += `\nContenido en ${fileName}:\n`;
    console.log('Descargando archivo...');
    downloadFile().then(() => {
        try {
            const data = fs.readFileSync(path.join(filePath, fileName), 'utf-8');
            console.log(`data: ${data}`);
            answer += data;
        } catch (err) {
            console.log('Error aqui: 1!');
            console.error(err);
            answer += err;
        }
    }).catch(console.error);
    res.send(answer);
});

app.post('/', (req, res) => {
    const data = req.body;
    res.send('POST requested...');
});

const PORT = process.env.PORT || 8080;

// GCS
const fs = require('node:fs');
checkFile().then(exists => {
    if (exists[0]) {
        console.log(`${fileName} ya ha sido creado!`);
        app.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}...`);
        });
    } else {
        console.log('Creando...');
        try {
            fs.writeFileSync(path.join(filePath, fileName), '');
            console.log(`${fileName} creado en ${filePath}`)
        } catch (err) {
            console.error(err);
        }
        uploadFile().then(() => {
            app.listen(PORT, () => {
                console.log(`Server listening on port ${PORT}...`);
            });
        }).catch(console.error);
    }
}).catch(console.error);

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
