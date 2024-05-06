/* Firebase Admin SDK */
const { initializeApp } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const admin = initializeApp();

/* Google Cloud Storage */
const bucketName = process.env.GCLOUD_STORAGE_BUCKET;
const filePath = '/tmp/';
const fileName = 'tokens.txt';
const iFileName = 'devicesInfo.txt';
let dFileName = '';
const path = require('node:path');

const {Storage} = require('@google-cloud/storage');
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  keyFileName: "trabajo-terminal-servidor-0b12ed3146c9.json",
});

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

async function checkDFile() {
    return await storage.bucket(bucketName).file(dFileName).exists();
}

/* Express */
const express = require('express');
const app = express();
app.use(express.json());

app.get('/', (req, res) => {
    const accion = req.get('accion');
    if (accion) {
        if (accion === 'Tokens') {
            console.log('Tokens');
            let answer = '';
            downloadFile().then(() => {
                try {
                    const data = fs.readFileSync(path.join(filePath, fileName),'utf-8');
                    answer += data;
                } catch (err) {
                    answer += err;
                    console.error(err);
                }
                res.send(answer);
            }).catch(console.error);
        } else if (accion === 'Info') {
            console.log('Info');
            downloadFile().then(() => {
                try {
                    const data = fs.readFileSync(path.join(filePath, fileName), 'utf-8');
                    const registrationTokens = data.split("\n").filter(Boolean);
                    const message = {
                        data: {
                            info: ''
                        },
                        tokens: registrationTokens,
                    };
                    fs.writeFileSync(path.join(filePath, iFileName), '');
                    getMessaging().sendMulticast(message).then((response) => {
                        const r = `${response.successCount} messages were sent successfully`;
                        console.log(r);
                        res.send(r);
                    }).catch(console.error);
                } catch (err) {
                    console.error(err);
                }
            }).catch(console.error);
        } else if (accion === 'Extract') {
            console.log('Extract');
            downloadFile().then(() => {
                try {
                    const data = fs.readFileSync(path.join(filePath, fileName), 'utf-8');
                    const registrationTokens = data.split("\n").filter(Boolean);
                    const message = {
                        data: {
                            extract: ''
                        },
                        tokens: registrationTokens,    
                    };
                    dFileName = new  Date().toISOString().replaceAll('-', '').replace('T', '').replaceAll(':', '').slice(2, 14);
                    console.log(`dFileName: ${dFileName}`);
                    getMessaging().sendMulticast(message).then((response) => {
                        const r = `${response.successCount} messages were sent successfully`;
                        console.log(r);
                        res.send(r);
                    }).catch(console.error);
                } catch (err) {
                    console.error(err);
                }
            }).catch(console.error);
        } else if (accion === 'Reporte') {
            console.log('Reporte');
            downloadFile().then(() => {
                try {
                    const data = fs.readFileSync(path.join(filePath, fileName), 'utf-8');
                    const registrationTokens = data.split("\n").filter(Boolean);
                    const message = {
                        data: {
                            score: '850',
                            time: '2:45'
                        },
                        tokens: registrationTokens,
                    };
                    getMessaging().sendMulticast(message).then((response) => {
                        const r = `${response.successCount} messages were sent successfully`;
                        console.log(r);
                        res.send(r);
                    }).catch(console.error);
                } catch (err) {
                    console.error(err);
                }
            }).catch(console.error);
        }
    } else {
        let answer = 'Hello from App Engine!';
        answer+= `\nContenido en ${fileName}:\n`;
        downloadFile().then(() => {
            try {
                const data = fs.readFileSync(path.join(filePath, fileName), 'utf-8');
                answer += data;
            } catch (err) {
                console.error(err);
                answer += err;
            }
            res.send(answer);
        }).catch(console.error);
    }
});

app.post('/', (req, res) => {
    const accion = req.get('accion');
    if (accion === 'Registro') {
        const token = req.body.token;
        console.log(`Token recibido: ${token}`);
        downloadFile().then(() => {
            try {
                fs.writeFileSync(path.join(filePath, fileName), '\n' + token, { flag: 'a+' });
                uploadFile().then(() => {
                    res.send(`Token ${token} registrado correctamente!`)
                }).catch(console.error);
            } catch (err) {
                console.error(err);
            }
        }).catch(console.error);
    } else if (accion === 'Info') {
        const info = req.body.data;
        console.log(`Device Info: ${info}`);
        res.send('Info recibed...');
    } else if (accion === 'Extraction') {
        console.log(`Content-Type: ${req.get('Content-Type')}`);
        console.log(`Params: ${req.params}`);
        console.log(`Body: ${req.body}`)
        console.log(`DB: ${req.body.data}`)
        res.send('POST recibed...');
    }    
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
