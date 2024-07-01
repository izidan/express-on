import yaml from 'js-yaml';

export const parse = str => yaml.load(str, { json: true })

export const stringify = obj =>
    yaml.dump(Array.isArray(obj) ? obj : !isNaN(obj) ? obj.toString() : [obj], { skipInvalid: true });

export default { stringify, parse };