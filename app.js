const fs = require('fs')
const ora = require('ora')
const chalk = require('chalk')
const SESSION_FILE_PATH = './session.json';

let client;
let sessionData;

/**
 * Esta funcion genera el QRCODE ***
 */

const qrcode = require('qrcode-terminal');

const { Client } = require('whatsapp-web.js');
const client = new Client();

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.initialize();