#!/usr/bin/env node
import alias from 'module-alias'
//alias.addPath(process.cwd() + '/node_modules')
alias();
//(await import('module-alias')).default()
import mongoose from './mongoose.js'
import module from 'node:module'
import app from './app.js'
import debug from 'debug'

const log = debug('express:on')

let server = app;

if (Object.values(module._pathCache).includes(import.meta.filename) || app.get('env') == 'test') {

    process.on('unhandledRejection', err => log(err));
    process.on('unhandledException', err => log(err));

    if (process.platform === 'win32' && !process.send && app.get('env') !== 'test')
        import('readline').then(readline => readline.createInterface({ input: process.stdin, output: process.stdout })
            .on('SIGINT', function () { process.emit('SIGINT'); }));

    process.on('SIGINT', function () {
        log('express server stopped');
        process.exit();
    });

    process.on('SIGTERM', function () {
        log('express server stopped');
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
            .then(db => log(`mongoose connected to database [${db.name
                || (db.connections || mongoose.connections)[0].name
                || (db.connections || mongoose.connections)[0].client.options.dbName
                }] successfully`))
            .catch(err => error(err));

    if (!!process.env.PORT)
        app.set('port', process.env.PORT)

    if (!!app.get('port'))
        server = app.listen(app.get('port'), '0.0.0.0', () =>
            log(`server listening on port ${app.get('port')}`))
    else log('server not started, because no port was specified')
} else log('server not started, because it is not being run via CLI')

export default server;
