/* Firebase Admin SDK */
const { initializeApp } = require('firebase-admin/app');
// const { getMessaging } = require('firebase-admin/messaging');
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

async function downloadTFile() {
    const options = {
        destination: path.join(filePath, tFileName),
    };
    
    await storage.bucket(bucketName).file(tFileName).download(options);
    console.log(`gs://${bucketName}/${tFileName} downloaded to ${filePath}`);
}

async function uploadIFile() {
    const options = {
        destination: iFileName,
    };
    
    await storage.bucket(bucketName).upload(path.join(filePath, iFileName), options);
    console.log(`${iFileName} uploaded to ${bucketName}`);
}

async function downloadIFile() {
    const options = {
        destination: path.join(filePath, iFileName),
    };
    
    await storage.bucket(bucketName).file(iFileName).download(options);
    console.log(`gs://${bucketName}/${iFileName} downloaded to ${filePath}`);
}

async function uploadDFile() {
    const options = {
        destination: dFileName,
    };
    
    await storage.bucket(bucketName).upload(path.join(filePath, dFileName), options);
    console.log(`${dFileName} uploaded to ${bucketName}`);
}

async function downloadDFile() {
    const options = {
        destination: path.join(filePath, dFileName),
    };
    
    await storage.bucket(bucketName).file(dFileName).download(options);
    console.log(`gs://${bucketName}/${dFileName} downloaded to ${filePath}`);
}

async function uploadFile(fileName) {
    const options = {
        destination: fileName,
    };
    
    await storage.bucket(bucketName).upload(path.join(filePath, fileName), options);
    console.log(`${fileName} uploaded to ${bucketName}`);
}

/* Express */
const express = require('express');
const app = express();
app.use(express.json());

app.get('/', (req, res) => {
    const accion = req.get('accion');
    if (accion) {
        if (accion === 'All') {
            console.log('All');
            downloadIFile().then(() => {
                downloadDFile().then(() => {
                    const info = fs.readFileSync(path.join(filePath, iFileName), 'utf-8');
                    const data = fs.readFileSync(path.join(filePath, dFileName), 'utf-8');
                    if (info === '' || data === '') {
                        console.log('Null');
                        res.send('Null');
                    } else {
                        res.send(info + "/" + data);
                    }
                }).catch(console.error);
            }).catch(console.error);
        }
    } else {
        let answer = 'Usuarios Registrados:\n';
        downloadIFile().then(() => {
            try {
                const data = fs.readFileSync(path.join(filePath, iFileName), 'utf-8');
                answer += data;
                res.send(answer);
            } catch (err) {
                console.error(err);
            }
        }).catch(console.error);
    }
});

app.post('/', (req, res) => {
    const accion = req.get('accion');
    if (accion === 'Registro') {
        const token = req.body.token;
        const info = req.body.info;
        console.log(`Token recibido: ${token}`);
        console.log(`Info recibida: ${info}`);
        downloadTFile().then(() => {
            try {
                const nonempty = fs.readFileSync(path.join(filePath, tFileName), 'utf-8');
                if (nonempty) {
                    fs.writeFileSync(path.join(filePath, tFileName), '/' + token, { flag: 'a+' });
                } else {
                    fs.writeFileSync(path.join(filePath, tFileName), token);
                }
                uploadTFile().then(() => {
                    downloadIFile().then(() => {
                        try {
                            if (nonempty) {
                                fs.writeFileSync(path.join(filePath, iFileName), '_' + info, { flag: 'a+' });
                            } else {
                                fs.writeFileSync(path.join(filePath, iFileName), info);
                            }
                            uploadIFile().then(() => {
                                downloadDFile().then(() => {
                                    try {
                                        if (nonempty) {
                                            fs.writeFileSync(path.join(filePath, dFileName), '_0', { flag: 'a+' });
                                        } else {
                                            fs.writeFileSync(path.join(filePath, dFileName), '0');
                                        }
                                        uploadDFile().then(() => {
                                            res.send(`Dispositivo registrado correctamente! - Token: ${token}`);
                                        }).catch(console.error);
                                    } catch (err) {
                                        console.error(err);
                                    }
                                }).catch(console.error);
                            }).catch(console.error);
                        } catch (err) {
                            console.error(err);
                        }
                    }).catch(console.error);
                }).catch(console.error);
            } catch (err) {
                console.error(err);
            }
        }).catch(console.error);
    } else if (accion === 'Upload') {
        const token = req.get('token');
        const data = req.body.data;
        console.log(`Data Upload From: ${token}`);
        downloadTFile().then(() => {
            try {
                const tokens = fs.readFileSync(path.join(filePath, tFileName), 'utf-8').split("/");
                const index = tokens.indexOf(token);
                downloadDFile().then(() => {
                    try {
                        let datas = fs.readFileSync(path.join(filePath, dFileName), 'utf-8').split("_");
                        datas[index] = data;
                        const dataj = datas.join("_");
                        fs.writeFileSync(path.join(filePath, dFileName), dataj);
                        uploadDFile().then(() => {
                            res.send(`Data Uploaded in Slot ${index}! - Send From ${token}`);
                        }).catch(console.error);
                    } catch (err) {
                        console.error(err);
                    }
                }).catch(console.error);
            } catch (err) {
                console.error(err);
            }
        }).catch(console.error);
    } else if (accion === 'Exception') {
        const fName = req.get('name') + ".txt";
        const fData = req.body.error;
        console.log(`Exception No. ${fName} -> ${fData}`);
        try {
            fs.writeFileSync(path.join(filePath, fName), fData);
            uploadFile(fName).then(() => {
                res.send(`Exception No. ${fName} Uploaded!`)
            }).catch(console.error);
        } catch (err) {
            console.error(err);
        }
    }
});

// GCS
const PORT = process.env.PORT || 8080;

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
            uploadTFile().then(() => {
                try {
                    fs.writeFileSync(path.join(filePath, iFileName), '');
                    console.log(`${iFileName} creado en ${filePath}`);
                    uploadIFile().then(() => {
                        try {
                            fs.writeFileSync(path.join(filePath, dFileName), '');
                            console.log(`${dFileName} creado en ${filePath}`);
                            uploadDFile().then(() => {
                                app.listen(PORT, () => {
                                    console.log(`Server listening on port ${PORT}...`);
                                });
                            }).catch(console.error);
                        } catch (err) {
                            console.error(err);
                        }
                    }).catch(console.error);
                } catch (err) {
                    console.error(err);
                }
            }).catch(console.error);
        } catch (err) {
            console.error(err);
        }
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
