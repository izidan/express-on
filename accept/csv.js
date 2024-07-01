import { stringify as j2csv } from 'csv-stringify/sync';
import { toObject } from './../regex.js';
import camelcase from 'camelcase-keys';
import { PassThrough } from 'stream';
import { flatten } from 'flat';
import csv from 'csv-parser';

export const parser = (separator = ',') => csv({
    mapHeaders: ({ header }) => Object.keys(camelcase({ [header.replace(/\(|\)|\[|\]|\\|\/|{|}/g, ' ')]: header }))[0],
    mapValues: ({ value }) => toObject(value),
    separator
})

export const parse = function (str, out = []) {
    // this refers to the request object
    let type = (this.headers || {})['content-type'];
    let stream = this.pipe ? this : new PassThrough().end(Buffer.from(str));
    return new Promise(resolve => stream.pipe(parser(type.match(/tsv|tab/) ? '\t' : ','))
        // minimise the object by removing empty attributes where the value is null or undefined
        .on('data', obj => out.push(Object.keys(obj).forEach((k) => obj[k] == null && delete obj[k]) || obj))
        //.on('data', obj => out.push(obj))
        .on('end', () => resolve(out)))
}

export const stringify = function (obj, delimiter = ',') {
    let options = {
        delimiter,
        cast: { date: v => JSON.parse(JSON.stringify((v))) },
        header: obj instanceof Object && Object.keys(obj).length > 0
    };
    obj = options.header ? flatten(obj) : { "": obj };
    let output = j2csv([obj], options);
    let header = output.match(/^.*?\n/)[0]
        .replace(/(,\w+\.)\d+(\.?[^,]*)?(\1\d+\2)+/g, '$1*')
        .replace(/^[\d,\.\*]+\s*$/, '');
    if (options.header)
        output = output.replace(/^.*?\n/, this.locals.header !== header ?
            (this.locals.header ? '\n' : '') + header : '');
    this.locals.header = header;
    return output.trimLeft().replace(/,"$/gm, '')
};

export default { stringify, parse, parser };