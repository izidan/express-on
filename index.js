#!/usr/bin/env node

require('module-alias').addPath(process.cwd() + '/node_modules');
const mongoose = require('./mongoose');
const colors = require('colors/safe');
const app = require('./app');

module.exports = app;

if (!module.parent || __dirname === process.cwd()) {

    process.on('unhandledRejection', err => console.error(colors.red(err)));
    process.on('unhandledException', err => console.error(colors.red(err)));

    if (process.platform === 'win32' && !process.send && app.get('env') !== 'test')
        require('readline').createInterface({ input: process.stdin, output: process.stdout })
            .on('SIGINT', function () { process.emit('SIGINT'); });

    process.on('SIGINT', function () {
        console.info(colors.red('express server stopped'));
        process.exit();
    });

    process.on('SIGTERM', function () {
        console.info(colors.red('express server stopped'));
        process.exit();
    });

    // configure default mongoose settings
    //try { mongoose.set('autoIndex', false) } catch (e) { }
    //try { mongoose.set('strictQuery', false) } catch (e) { }
    //try { mongoose.set('useCreateIndex', true) } catch (e) { }
    //try { mongoose.set('useNewUrlParser', true) } catch (e) { }
    //try { mongoose.set('useUnifiedTopology', true) } catch (e) { }
    mongoose.set('debug', (process.env.DEBUG || '').match(/(^|,)mongoose(\*|,|$)/));

    // connect with mongodb uri sepcified
    if (!!process.env.MONGO_URI)
        mongoose.connect(process.env.MONGO_URI || "mongodb://localhost/test")
            .then(db => console.info(colors.green(`mongoose connected to database [${db.name || (db.connections || mongoose.connections)[0].name}] successfully`)))
            .catch(err => console.error(colors.red(err)));

    if (!!app.get('port'))
        module.exports = app.listen(app.get('port'), '0.0.0.0', () =>
            console.info(colors.green(`express server listening on port ${app.get('port')}`)));
};
