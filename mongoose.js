import { unflatten } from 'flat';
import mongoose from 'mongoose';
import yaml from 'js-yaml';

const { Schema, SchemaType, VirtualType } = mongoose;
const refs = { '#/definitions/': {}, '#/components/schemas/': {} };

import { toDate } from './regex.js';
const supercast = mongoose.Date.cast();
mongoose.Date.cast(v => supercast(v instanceof Date ? v : toDate(`${v}`) || v));

export default mongoose;

let { explicit, compiledExplicit, compiledTypeMap } = (yaml.Schema.create || yaml.DEFAULT_SCHEMA.extend).call(yaml, [
    new yaml.Type('tag:yaml.org,2002:definitions', {
        // Available kinds are sequence (arrays), 'scalar' (string) and 'mapping' (object).
        kind: 'mapping',
        // Loader must check if the input object is suitable for this type.
        resolve: map => map !== null && Object.keys(map).length > 0,
        // If a node is resolved, use it to create a Model instance.
        construct: models => mapping('#/definitions/', models)
    }),
    new yaml.Type('tag:yaml.org,2002:schemas', {
        // Available kinds are sequence (arrays), 'scalar' (string) and 'mapping' (object).
        kind: 'mapping',
        // Loader must check if the input object is suitable for this type.
        resolve: map => map !== null && Object.keys(map).length > 0,
        // If a node is resolved, use it to create a Model instance.
        construct: models => mapping('#/components/schemas/', models)
    })
]);
let DEFAULT_SCHEMA = yaml.DEFAULT_FULL_SCHEMA || yaml.DEFAULT_SCHEMA;
Object.assign(DEFAULT_SCHEMA.compiledTypeMap.fallback, compiledTypeMap.fallback);
Object.assign(DEFAULT_SCHEMA.compiledTypeMap.mapping, compiledTypeMap.mapping);
DEFAULT_SCHEMA.compiledExplicit.push(compiledExplicit);
DEFAULT_SCHEMA.explicit.push(explicit);

function mapping(path = '#/definitions/', models = {}) {
    refs[path] = Object.entries(models).reduce((m, [k, v]) => ({ ...m, [v]: k }), {});
    return Object.entries(models)
        .reduce((map, [k, v]) => ({ ...map, [k]: (mongoose.models[v] || { schema: v }).schema }), {});
}

Schema.prototype.toJSON = function () {
    let def = {};
    // generate property definition for all schema paths including virtuals
    let props = Object.entries(this.paths).concat(Object.entries(this.virtuals))
        .reduce((map, [name, path]) => ({ ...map, [name.replace(/\./g, '.properties.')]: path }), {});
    // check if there is a schema location and set it as the description for furhter details of the schema
    def.description = (props['@xsi:schemaLocation'] || props['_xsi:schemaLocation'] || {}).defaultValue;
    // dervice the xml name for the schema based on xsi:type attribute if it exists
    def.xml = { name: (props['@xsi:type'] || props['_xsi:type'] || {}).defaultValue };
    if (!def.xml.name) delete def.xml;
    // aliases should inherit the definition of the underlying schema field
    Object.entries(this.aliases).forEach(([k, v]) => props[k] = props[v]);
    // hydrate the properties
    props = JSON.parse(JSON.stringify(props));
    // group the dotted properties to construct valid hierarchy
    def.properties = unflatten(props);
    // populate the required schema fields
    def.required = this.requiredPaths();
    if (def.required.length == 0) delete def.required;
    // return full schema swagger definition
    return def;
};

Schema.prototype.toObject = function () {
    if (!this.object)
        this.object = unflatten(JSON.parse(JSON.stringify(this.toJSON()), (k, v) =>
            !v ? {} : v.type === 'array' ? [v.items.properties || v.items] :
                v.properties ? v.properties : !!v.type ? {} : v));
    return JSON.parse(JSON.stringify(this.object));
};

SchemaType.prototype.toJSON = function () {
    let opts = Object.assign({}, this.caster ? this.caster.options : {}, this.options);
    // unwind certain fields from the type options
    let { description, format, pattern, ref, $ref, hide, alias, select, type, $skipDiscriminatorCheck } = opts;
    // if the field is hidden, alias sat to false, or always deselected then skip
    if (hide === true || alias === false || select === false || type === false || $skipDiscriminatorCheck === true) return undefined;
    // detect type name from either the schema type name or the instance
    type = (this.schemaName || this.instance || 'object').toLowerCase();
    // date is a type string with format date
    if (type === 'date') {
        type = 'string';
        format = format || this.path.match(/time/i) ? 'date-time' : 'date';
    }
    // populate basic definition information
    let def = { type, description, format, pattern };
    // set enum values when there are enums
    if ((this.enumValues || []).length > 0)
        def.enum = this.enumValues;
    // set defaults when defined
    if (this.options.default)
        def.defaultValue = this.options.default;
    // references should link to other types definitions
    ref = ref || $ref;
    let schema = this.caster ? this.caster.schema || this.schema : this.schema;
    if (!schema && type === 'mixed' && opts.type && opts.type.constructor === Object)
        schema = new Schema(opts.type, { id: false, _id: false, versionKey: false });
    if (ref)
        if (refs['#/definitions/'][ref])
            def.$ref = '#/definitions/' + refs['#/definitions/'][ref];
        else if (refs['#/components/schemas/'][ref])
            def.$ref = '#/components/schemas/' + refs['#/components/schemas/'][ref];
        else if (mongoose.models[ref])
            schema = mongoose.models[ref].schema;
        else if (ref.schema instanceof Schema)
            schema = ref.schema;
    // embed swagger definition for embedded schemas
    if (schema)
        Object.assign(def, JSON.parse(JSON.stringify(schema)), { type: undefined });
    // if type is still mixed then default to object
    if (['mixed', 'array'].includes(def.type))
        def.type = (opts.type.toString().match(/[A-Z][a-z]+/) || ['Object'])[0].toLowerCase();
    // if type is an array to adjust the swagger definition to reflect so
    if (type === 'array')
        def = { type: 'array', items: def };
    // return full path swagger definition
    return def;
};

VirtualType.prototype.toJSON = function () {
    let def = SchemaType.prototype.toJSON.call(this);
    if (!def) return undefined;
    let { justOne, localField, foreignField } = this.options;
    // when populated virtuals returns arrays then definition should reflect that
    if (!!localField && !!foreignField && justOne !== true) {
        delete def.type;
        def = { type: 'array', items: def };
    }
    // return full virtual swagger definition
    return def;
};

// Wrap the mongoose model function to add this mixin to all registered models.
const model = mongoose.model;
mongoose.model = (...args) => {
    let m = model.apply(mongoose, args);
    if (!m.singular) {
        m.options = Object.assign({}, m.options);
        for (let f of ['plural', 'singular', 'select', 'lastModified', 'findBy', 'locking', 'sort'])
            m[f] = function (v) {
                if (v === undefined)
                    return this.options[f];
                this.options[f] = v;
                return this;
            }
        m.singular(m.modelName);
        m.plural(m.collection.collectionName);
    }
    return m;
};
