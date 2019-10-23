#!/usr/bin/env node

const formatters = require('./formatters');
const compression = require('compression');
const errors = require('http-errors');
const express = require('express');
const logger = require('morgan');
const debug = require('debug');
const cors = require('cors');
const path = require('path');

express.Controller = require('./controller');

const app = express();

if (app.get('env') !== 'test') {
    require('dotenv').config();
    app.set('port', process.env.PORT);
    app.use(logger(process.env.NODE_ENV || 'dev'));
};

// view engine setup
app.set('view engine', 'pug');
app.set('views', path.join(process.cwd(), 'views'));
app.set('routes', path.join(process.cwd(), 'routes'));

app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public', { maxAge: 3600000 }));

app.use(formatters());
app.use('/', require(app.get('routes')));

// catch 404 and forward to error handler
app.use((req, res, next) => next(errors(404)))

// error handler
app.use((err, req, res, next) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;

if (!module.parent) {

    process.on('unhandledRejection', err => debug('app:error')('%O', err) && process.exit(1));

    app.listen(app.get('port'), '0.0.0.0', () =>
        debug('app:info')('express server listening on port %o', app.get('port')));

    // only configure mongoose when a mongodb connection string exists
    if (!process.env.MONGO_URI) return;

    const mongoose = require('mongoose');

    mongoose.set('autoIndex', false);
    mongoose.set('autoReconnect', true);
    mongoose.set('useCreateIndex', true);
    mongoose.set('useNewUrlParser', true);
    mongoose.set('useUnifiedTopology', true);
    mongoose.set('debug', (process.env.DEBUG || '').match(/(^|,)mongoose(\*|,|$)/));

    mongoose.connect(process.env.MONGO_URI || "mongodb://localhost/test")
        .then(db => debug('app:info')('connected to database [%s] successfully',
            db.name || (db.connections || mongoose.connections)[0].name))
        .catch(err => debug('app:error')('%O', err));
};
