import compression from 'compression';
import { fileURLToPath } from 'url';
import accepts from './accepts.js';
import errors from 'http-errors';
import { dirname } from 'path';
import express from 'express';
import logger from 'morgan';
import yaml from 'js-yaml';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const maxAge = 3600000;
const app = express();

if (app.get('env') !== 'test')
    import('dotenv').then(dotenv => {
        dotenv.config();
        app.use(logger('dev'));
        app.use(compression());
        app.use(cors());
    });

// view engine setup
app.set('view engine', 'pug');
app.set('routes', './routes.js');
app.set('port', process.env.PORT);
app.set('views', path.join(process.cwd(), 'views'));
app.set('statics', path.join(process.cwd(), 'public'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(app.get('statics'), { maxAge }));

// skip text body parser for csv and tsv as the internal parser handles streaming directly
app.use(express.text({ limit: '64mb', type: ['*/plain', '*/text', '*/yaml', '*/txt', '*/yml', '*/xml'] }));
app.use(accepts());
app.head('*', (req, res) => res.status(204).end());
//import(app.get('routes')).then(router => app.use('/', router.default));
app.use('/', (await import(app.get('routes'))).default);
app.get('/favicon.ico', (req, res) => res.status(410).end());
// static handler for redoc ui
app.get(/redoc\.html?/, (req, res) => res.sendFile(__dirname + '/public/redoc.html', { maxAge, headers: { 'Content-Type': 'text/html' } }));
// static handler for swagger ui
app.get(/swagger\.html?/, (req, res) => res.sendFile(__dirname + '/public/swagger.html', { maxAge, headers: { 'Content-Type': 'text/html' } }));
// fallback handler to check if a swagger yaml file exists matching the path, then generate json, save it and send it back
app.get(/swagger$/, (req, res, nxt) =>
    !fs.existsSync(req.file = path.join(app.get('statics'), req.path + '.yaml')) ? nxt() :
        fs.readFile(req.file, (err, data) => fs.writeFile(req.file = req.file.replace('yaml', 'json'), JSON.stringify(err || yaml.load(data)),
            () => res.redirect(req.path + '.json'))));
// catch 404 and forward to error handler
app.use((req, res, next) => next(errors(404)));

// error handler
app.use((err, req, res, nxt) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.locals.xml = err.constructor.name;
    // render the error page
    if (!res._headerSent)
        res.status(err.status || 500).send(err.toJSON());
});

export default app;
