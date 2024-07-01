import { XML, CSV, YAML, JSON } from './accept/index.js';
import { Transform } from 'stream';
import errors from 'http-errors';
import express from 'express';

const { NotFound, BadRequest, UnsupportedMediaType } = errors;

express.static.mime.define({
    'application/js': ['jsonp'],
    'application/jsonp': ['jsonp'],
    'application/javascript': ['jsonp'],
});

export default () => (req, res, next) => {
    let formats = {
        jsonp: formatter.bind(res, 'jsonp', JSON.stringify, req.query.callback + '([', '])', ',', next, true),
        json: formatter.bind(res, 'json', JSON.stringify, '[', ']', ',', next),
        csv: formatter.bind(res, 'csv', CSV.stringify, null, null, null, next),
        tsv: formatter.bind(res, 'csv', CSV.stringify, null, null, '\t', next),
        yml: formatter.bind(res, 'text', YAML.stringify, '---\n', null, null, next),
        xml: formatter.bind(res, 'xml', XML.stringify, '<xml>', '</xml>', null, next),
    };
    formats = {
        'text/xml': formats.xml, 'text/tsv': formats.tsv, 'text/plain': formats.yml,
        'application/tsv': formats.tsv, 'application/csv': formats.csv, 'text/comma-separated-values': formats.csv,
        'application/jsonp': formats.jsonp, 'application/js': formats.jsonp, 'application/javascript': formats.jsonp,
        yaml: formats.yml, text: formats.yml, txt: formats.yml, html: formats.xml, ...formats
    };
    // check if format is specified in the url and set the accept header accordingly
    let content = (req.url.match(/(?!^[^\?]+)\.(xml|txt|yml|csv|tsv|json|text|yaml|jsonp|js)(\?|$)/gi) || [])[0];
    if (content) {
        req.url = req.url.replace(content, '?');
        req.headers.accept = express.static.mime.types[content.split(/[^\w]/)[1]];
    } else if (['', '*/*', 'application/*', null, undefined].includes(req.headers.accept))
        req.headers.accept = 'application/json'; // otherwise default to json
    // set the response formatter handler
    res.format(formats);
    // only parse request body for certain http methods when content is set
    if (!['PUT', 'POST', 'PATCH'].includes(req.method)) return next();
    if (req.get('content-length') <= 0) return next();
    let parsers = {
        csv: CSV.parse.bind(req),
        tsv: CSV.parse.bind(req),
        xml: XML.parse.bind(req),
        yml: YAML.parse.bind(req),
        json: JSON.parse.bind(req),
    };
    parsers = {
        'text/xml': parsers.xml, 'text/tsv': parsers.tsv, 'text/plain': parsers.yml,
        'application/tsv': parsers.tsv, 'application/csv': parsers.csv, 'text/comma-separated-values': parsers.csv,
        yaml: parsers.yml, text: parsers.yml, txt: parsers.yml, html: parsers.xml, ...parsers
    };
    // check content type for parsing the body as well
    content = req.get('content-type') || req.headers.accept;
    content = express.static.mime.extensions[content] || content;
    if (!(content = parsers[content])) return next(UnsupportedMediaType());
    return new Promise(resolve => resolve('function' === typeof content ? content(req.body) : req.body))
        .then(body => req.body = body).then(() => next())
        .catch(ex => next(BadRequest(ex.message || ex)))
};

const formatter = function (type, transform, prefix, suffix, delimiter, next, force) {
    const response = this;
    let send = this.send.bind(this);
    let stringify = array => {
        let last;
        return new Transform({
            objectMode: true,
            transform(doc, enc, callback) {
                try {
                    if (!!type && response.headersSent === false)
                        response.type(type);
                    // force toJSON
                    doc = doc.toJSON ? doc.toJSON() : doc;
                    // delete mongoose enforced default discriminator key
                    if (doc instanceof Object)
                        delete doc.__t;
                    if (doc instanceof Array)
                        array = true;
                    else
                        doc = [doc];
                    // transform
                    doc = doc.map(obj => transform.call(response, obj, delimiter)).join((delimiter || '').trimLeft())
                        // fix exponential numbers representation from 1e-5 to 0.000001 with 100 digits max limit
                        .replace(/(?![:|>|,])\d[\d|\.]*e[-|\+]\d+/g, t => Number(t).toFixed(Math.min(100, t.length - 4 + Number(t.split('e-')[1]))));
                    if (array === true || force === true) {
                        // write prefix first
                        if (prefix && last === undefined)
                            response.write(prefix, enc);
                        // write delimiter if not the first object
                        if (!!delimiter && last !== undefined)
                            response.write(delimiter.trimLeft(), enc);
                        // define last to ensure array is closed
                        last = true;
                    }
                    // write the transformed object in the stream
                    last = response.write(doc, enc);
                } catch (err) {
                    if (last === undefined)
                        return next(err);
                    let obj = err.toJSON();
                    if (type === 'xml')
                        obj['@xsi:type'] = err.constructor.name;
                    obj = transform.call(response, obj, delimiter);
                    if (delimiter && array === true)
                        response.write(delimiter, enc);
                    response.write(obj, enc);
                }
                callback();
            },
            final() {
                if (!response._header) response.type(type);
                response.end(last !== undefined ? suffix && (array === true || force === true) ? suffix : undefined :
                    transform.call(response.status(404), NotFound().toJSON()))
            }
        });
    };
    this.send = data => data instanceof Error ? stringify(this.status(data.status || 500)).end(data) :
        ['string', 'buffer'].includes(typeof data) ? send(data) :
            ['boolean'].includes(typeof data) ? stringify(data) : stringify().end(data);
};

Error.prototype.toJSON = function () {
    return {
        status: this.status || 500, message: this.message,
        details: this.stack ? `<!--${this.stack}-->` : undefined
    }
};

Date.prototype.toJSON = function () {
    try {
        let local = this.getTime() - this.getTimezoneOffset() * 1000 * 60;
        local = new Date(local).toISOString().replace(/[T|\s]00:00:00(.0+)?Z?/, '');
        return local.length === 10 ? local : this.toISOString().replace(/[T|\s]00:00:00(.0+)?Z?/, '');
    } catch (ex) { return ex.message }
};
