const fs = require('fs')
const ora = require('ora')
const chalk = require('chalk')
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const SESSION_FILE_PATH = './session.json';

let client;
let sessionData;

/**
 * Esta funcion genera el QRCODE ***
 */

const withSession = () => {

    const spinner = ora(`Cargando ${chalk.yellow('Validando session con Whatsapp')}`);
    sessionData = require(SESSION_FILE_PATH);
    spinner.Start();

    client = new Client({
        session:sessionData
    })

    client.on('ready', () => {
        console.log('Client is ready!');
        spinner.Stop();
    });

    client.on('auth_failure', () => {
        spinner.Stop();
        console.log('** Error de autentificacion vuelve a generar el QRCODE (Borra el a)');
    })

    client.initialize();
}

const withOutSession = () => {

    console.log('No tenemos session guardada');
    
    client = new Client();
    
    client.on('qr', (qr) => {
        qrcode.generate(qr, { small : true });
    });
    
    client.on('authenticated', (session) => {
        //Guardamos credenciales de sission para usar luego
        sessionData = session;
        fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function(err) {
            if(err){
                console.log(err);
            }
        });
    });

    client.initialize();

}

/** */
(fs.existsSync(SESSION_FILE_PATH)) ? withSession() : withOutSession();