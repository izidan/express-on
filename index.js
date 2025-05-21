#!/usr/bin/env node
import alias from 'module-alias'
//alias.addPath(process.cwd() + '/node_modules');
alias();
//(await import('module-alias')).default();
import { resolve, dirname } from 'path'
import mongoose from './mongoose.js'
import colors from 'colors/safe.js'
import { fileURLToPath } from 'url'
import app from './app.js';

let server = app;

const pathToThisFile = resolve(fileURLToPath(import.meta.url))
const pathPassedToNode = resolve(process.argv[1])
const isThisFileBeingRunViaCLI = pathToThisFile.includes(pathPassedToNode)

const __dirname = dirname(fileURLToPath(import.meta.url));

if (isThisFileBeingRunViaCLI || __dirname === process.cwd()) {

    process.on('unhandledRejection', err => console.error(colors.red(err)));
    process.on('unhandledException', err => console.error(colors.red(err)));

    if (process.platform === 'win32' && !process.send && app.get('env') !== 'test')
        import('readline').then(readline => readline.createInterface({ input: process.stdin, output: process.stdout })
            .on('SIGINT', function () { process.emit('SIGINT'); }));

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
    //else throw console.error(colors.red('Please set MONGO_URI=mongodb://<connection-string>')) || 'Invalid configuration'

    if (!!process.env.PORT)
        app.set('port', process.env.PORT)

    if (!!app.get('port'))
        server = app.listen(app.get('port'), '0.0.0.0', () =>
            console.info(colors.green(`express server listening on port ${app.get('port')}`)));
};

export default server;
