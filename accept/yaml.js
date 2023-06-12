const yaml = require('js-yaml');

const parse = str => yaml.load(str, { json: true })

const stringify = obj =>
    yaml.dump(Array.isArray(obj) ? obj : !isNaN(obj) ? obj.toString() : [obj], { skipInvalid: true });

module.exports = { stringify, parse };