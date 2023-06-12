const { PassThrough } = require('stream');
const JSONStream = require('JSONStream');

const parse = function (str, out = []) {
    let stream = this.pipe ? this : new PassThrough().end(Buffer.from(str));
    return new Promise(resolve => stream.pipe(JSONStream.parse())
        .on('data', obj => out.push(obj))
        .on('end', () => resolve(out.length === 1 ? out.pop() : out)))
}

const stringify = JSON.stringify;

module.exports = { stringify, parse };