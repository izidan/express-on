#!/usr/bin/env node

const colors = require('colors/safe');
module.exports = require('./app');

if (!module.parent) {

    process.on('unhandledRejection', err => console.error(colors.red(err)));

    if (process.platform === 'win32')
        require('readline').createInterface({ input: process.stdin, output: process.stdout })
            .on('SIGINT', function () { process.emit('SIGINT'); });

    process.on('SIGINT', function () {
        console.info('express server stopped'.red);
        process.exit();
    });

    process.on('SIGTERM', function () {
        console.info('express server stopped'.red);
        process.exit();
    });

    app.listen(app.get('port'), '0.0.0.0', () =>
        console.info(`express server listening on port ${app.get('port')}`.green));

    // only configure mongoose when a mongodb connection string exists
    if (!!process.env.MONGO_URI) {
        let mongoose = require('mongoose');
        // configure default mongoose settings
        mongoose.set('autoIndex', false);
        mongoose.set('autoReconnect', true);
        mongoose.set('useCreateIndex', true);
        mongoose.set('useNewUrlParser', true);
        mongoose.set('useUnifiedTopology', true);
        mongoose.set('debug', (process.env.DEBUG || '').match(/(^|,)mongoose(\*|,|$)/));
        // connect with mongodb uri sepcified
        mongoose.connect(process.env.MONGO_URI || "mongodb://localhost/test")
            .then(db => console.info(`connected to database [${db.name || (db.connections || mongoose.connections)[0].name}] successfully`.green))
            .catch(err => console.error(color.red(err)));
    }
};
