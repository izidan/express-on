const through = require('through2');
const express = require('express');
const yaml = require('js-yaml');
const jxon = require('jxon');

jxon.config({ attrKey: '@', attrPrefix: '@', valueKey: '@' });

const stringify = {
    json: JSON.stringify,
    yaml: yaml.safeDump,
    xml: d => {
        let root = (d['@xsi:type'] || typeof d).split(':').pop();
        root = root.replace(/^[A-Z]+(?=($|[A-Z][a-z]))/, t => t.toLowerCase());
        if (root === d['@xsi:type'])
            delete d['@xsi:type'];
        if (!d['@id'] && !!d._id) {
            d['@id'] = d._id;
            delete d._id;
        }
        return jxon.jsToXml(d, null, root).toString();
    },
};

module.exports = () => (req, res, next) => {
    let formats = {
        yaml: formatter.bind(res, 'text', stringify.yaml, '---\n', null, '\n---\n'),
        text: formatter.bind(res, 'text', stringify.yaml, '---\n', null, '\n---\n'),
        yml: formatter.bind(res, 'text', stringify.yaml, '---\n', null, '\n---\n'),
        txt: formatter.bind(res, 'text', stringify.yaml, '---\n', null, '\n---\n'),
        html: formatter.bind(res, 'xml', stringify.xml, '<xml>', '</xml>', null),
        xml: formatter.bind(res, 'xml', stringify.xml, '<xml>', '</xml>', null),
        default: formatter.bind(res, 'json', stringify.json, '[', ']', ','),
    };
    // check if format is specified in the url and set the accept header accordingly
    let format = (req.url.match(/(?!^[^\?]+)\.(xml|txt|yml|json|text|yaml)(\?|$)/gi) || [])[0];
    if (format) {
        req.url = req.url.replace(format, '?');
        req.headers.accept = express.static.mime.types[format.split(/[^\w]/)[1]];
    } else if (!req.headers.accept) // otherwise default to json
        req.headers.accept = 'application/json';
    res.format(formats);
    next();
};

const formatter = function (type, transform, prefix, suffix, delimiter) {
    let send = this.send.bind(this);
    let stringify = array => {
        let last;
        return through.obj((doc, enc, callback) => {
            if (!!type && this.headersSent === false)
                this.type(type);
            if (doc instanceof Array)
                array = true;
            else
                doc = [doc];
            if (prefix && array === true && last === undefined)
                this.write(prefix, enc);
            if (delimiter && array === true && last !== undefined)
                this.write(delimiter, enc);
            for (obj of doc) {
                last = obj;
                obj = transform(obj.toJSON ? obj.toJSON() : obj);
                this.write(obj, enc);
            }
            callback();
        }, () => this.end(suffix && array === true ? suffix : undefined));
    };
    this.send = data => ['undefined', 'boolean'].includes(typeof data) ? stringify(data) :
        ['string', 'buffer'].includes(typeof data) ? send(data) : stringify().end(data);
};