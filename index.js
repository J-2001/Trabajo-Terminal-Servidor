/* Firebase Admin SDK */
const { initializeApp } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging'); // *
const admin = initializeApp();

/* Google Cloud Storage */
const bucketName = process.env.GCLOUD_STORAGE_BUCKET;
const filePath = '/tmp/';
const tFileName = 'tokens.txt';
const iFileName = 'info.txt';
const dFileName = 'data.txt';
const path = require('node:path');

const {Storage} = require('@google-cloud/storage');
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  keyFileName: "trabajo-terminal-servidor-0b12ed3146c9.json",
});

async function checkTFile() {
    return await storage.bucket(bucketName).file(tFileName).exists();
}

async function uploadTFile() {
    const options = {
        destination: tFileName,
    };
    
    await storage.bucket(bucketName).upload(path.join(filePath, tFileName), options);
    console.log(`${tFileName} uploaded to ${bucketName}`);
}

async function downloadFile() {
    const options = {
        destination: path.join(filePath, fileName),
    };
    await storage.bucket(bucketName).file(fileName).download(options);
    console.log(`gs://${bucketName}/${fileName} downloaded to ${filePath}`);
}

async function uploadIFile() {
    const options = {
        destination: iFileName,
    };
    
    await storage.bucket(bucketName).upload(path.join(filePath, iFileName), options);
    console.log(`${iFileName} uploaded to ${bucketName}`);
}

async function uploadDFile() {
    const options = {
        destination: dFileName,
    };
    
    await storage.bucket(bucketName).upload(path.join(filePath, dFileName), options);
    console.log(`${dFileName} uploaded to ${bucketName}`);
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
                        notification: {
                            title: 'Info',
                            body: 'getInfo()'
                        },
                        tokens: registrationTokens,
                    };
                    fs.writeFileSync(path.join(filePath, iFileName), '');
                    getMessaging().sendMulticast(message).then((response) => {
                        const r = response.successCount;
                        console.log(r);
                        res.send(r.toString());
                    }).catch(console.error);
                } catch (err) {
                    console.error(err);
                }
            }).catch(console.error);
        } else if (accion === 'CInfo') {
            console.log('CInfo');
            try {
                const n = fs.readFileSync(path.join(filePath, iFileName), 'utf-8').split("_").filter(Boolean);
                res.send(n.length.toString());
            } catch (err) {
                console.error(err);
            }
        } else if (accion === 'GInfo') {
            console.log('GInfo');
            try {
                const info = fs.readFileSync(path.join(filePath, iFileName), 'utf-8');
                res.send(info);
            } catch (err) {
                console.error(err);
            }
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
                    dFileName = new  Date().toISOString().replaceAll('-', '').replace('T', '').replaceAll(':', '').slice(2, 14) + ".txt";
                    getMessaging().sendMulticast(message).then((response) => {
                        const r = `${dFileName};${response.successCount}`;
                        console.log(r);
                        res.send(r);
                    }).catch(console.error);
                } catch (err) {
                    console.error(err);
                }
            }).catch(console.error);
        } else if (accion === 'CExtract'){
            console.log('CExtract');
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
        let answer = 'Usuarios Registrados:\n';
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
        try {
            const nonempty = fs.readFileSync(path.join(filePath, iFileName), 'utf-8');
            if (nonempty) {
                fs.writeFileSync(path.join(filePath, iFileName), '_' + info, { flag: 'a+'});
            } else {
                fs.writeFileSync(path.join(filePath, iFileName), info);
            }
            res.send('Info recibed...')
        } catch (err) {
            console.error(err);
        }
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
checkTFile().then(exists => {
    if (exists[0]) {
        console.log(`${tFileName} ya ha sido creado!`);
        app.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}...`);
        });
    } else {
        console.log('Creando...');
        try {
            fs.writeFileSync(path.join(filePath, tFileName), '');
            console.log(`${tFileName} creado en ${filePath}`)
        } catch (err) {
            console.error(err);
        }
        uploadTFile().then(() => {
            try {
                fs.writeFileSync(path.join(filePath, iFileName), '');
                console.log(`${iFileName} creado en ${filePath}`);
            } catch (err) {
                console.error(err);
            }
            uploadIFile().then(() => {
                try {
                    fs.writeFileSync(path.join(filePath, dFileName), '');
                    console.log(`${dFileName} creado en ${filePath}`);
                } catch (err) {
                    console.error(err);
                }
                uploadDFile().then(() => {
                    app.listen(PORT, () => {
                        console.log(`Server listening on port ${PORT}...`);
                    });
                }).catch(console.error);
            }).catch(console.error);
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
