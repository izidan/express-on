const formatters = require('./formatters');
const compression = require('compression');
const errors = require('http-errors');
const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const path = require('path');

express.Controller = require('./controller');

const app = express();

if (app.get('env') !== 'test') {
    require('dotenv').config();
    app.set('port', process.env.PORT);
    app.use(logger('dev'));
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
    res.render('error', e => res.send(e && e.message && e.message.indexOf('Failed to lookup view') !== -1) ? err : e)
});

module.exports = app;


