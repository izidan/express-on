import { Transform } from 'stream';
import deepmerge from 'deepmerge';
import errors from 'http-errors';
import mongoose from 'mongoose';
import debug from 'debug'

const error = debug('express:controller');
const { Forbidden, BadRequest, UnprocessableEntity } = errors;
/**
 * Base controller class where other controller inherits or
 * overrides pre defined and existing properties
 */
export class Controller {
    /**
     * @param {Model} model The default model object for the controller.
     * Will be required to create an instance of the controller
     */
    constructor(model) {
        this.model = model = typeof model === 'string' ? mongoose.model(model) : model
        if (!this.model || !this.model.schema)
            throw 'You must pass in a model or model name';
        let options = this.model.options || {};
        this.select = this.transpose(options.select);
        this._id = options.findBy || '_id';
        this.limit = options.limit || 10;
        this.sort = options.sort;
    }
    // #region helper methods
    /**
     * @param {Object} qry the query object to translate aliases from
     * @param {Boolean} strict flag to remove query fields not mapped to schema
     * @return {Object} the translated object
     */
    translate(qry = {}, strict = this.model.schema.options.strictQuery) {
        qry = qry.constructor === String ? JSON.parse(qry) : Object.assign({}, qry);
        // if any of the query values looks like a josn string then parse it into object
        Object.entries(qry).forEach(([key, val]) => {
            if (typeof val === 'string')
                // parse object or array strings
                if (val.match(/^[\[{].*?[\[}]$/)) val = JSON.parse(val);
                // parse array of values separated by comma or semicolon or pipe
                else if (val.match(/[,;]/)) val = val.split(/,|;|\|/);
            if (key.match(/[<!>]$/)) {
                delete qry[key];
                // check for query param like field<=
                if (key.match(/<$/)) val = { $lte: val };
                // check for query param like field>=
                else if (key.match(/>$/)) val = { $gte: val };
                // check for query param like field!=
                else if (key.match(/!$/))
                    // check for query param like field!=value1,value2,etc
                    if (Array.isArray(val)) val = { $nin: val };
                    // check for query param like field!=value1
                    else val = { $ne: val };
                key = key.substr(0, key.length - 1);
                // merge multiple > < ! udner the same key
                val = Object.assign(qry[key] || {}, val);
            }
            // check for query param like field=value1,value2,etc
            if (key[0] !== '$' && Array.isArray(val)) qry[key] = { $in: val };
            // check for query param like field=value1
            else qry[key] = val;
        });
        // translate the query aliased keys into underlying schema attibutes names
        qry = this.model.translateAliases(qry);
        // if schema strict query option is set then eliminate query params not matching schema paths
        if (strict)
            for (let key in qry)
                if (!this.model.schema.path(key))
                    delete qry[key];
        return qry;
    }
    /**
     * @param {String} select the select string to transform and translate aliases from
     * @return {Object} the transposed select object
    */
    transpose(select = '') {
        // handle select aliases, first translate the string into an object
        if (typeof select === 'string')
            select = select.trim().split(' ')
                .reduce((obj, key) => ({ ...obj, [key.substr(Number(key[0] === '-'))]: Number(key[0] !== '-') }), {});
        // translate the select to adjust for any aliased fields
        select = this.translate(select, false);
        // delete empty select field
        delete select[''];
        // correctly parse select nuerical values into valid ones
        return JSON.parse(JSON.stringify(select).replace(/:"(\d|true|false)"/gi, ':$1'));
    }
    /**
     * 
     * @param {Object} qry the query object to cleanse
     * @param {Object} opt the default query options 
     * @returns cleanse query options
     */
    params(qry, opt = {}) {
        opt = Object.assign({}, qry, opt);
        let { find = {}, select, limit = this.limit, skip = 0, count, distinct, sort = this.sort, explain, lean, aggregate } = opt;
        // aggregate query parameter check
        if (!!aggregate) {
            aggregate = 'string' === typeof aggregate && aggregate.trim()[0] === '[' ? JSON.parse(aggregate) : aggregate;
            aggregate = Array.isArray(aggregate) ? aggregate : [aggregate];
            aggregate = aggregate.map(obj => 'string' === typeof obj && obj.trim()[0] === '{' ? JSON.parse(obj) : obj)
                .filter(obj => Object.keys(obj).length === 1 && Object.keys(obj)[0][0] === '$');
            if (aggregate.length === 0)
                return BadRequest('Aggregate query parameter must be an array if set, resembles the mongo aggregate pipeline');
        }
        // count query parameter check
        if (![null, undefined, '', 'false', 'true'].includes(count))
            return BadRequest('Count must be "true" or "false" if set');
        else count = count === 'true' || undefined;
        // explain query parameter check
        if (![null, undefined, '', 'false', 'true'].includes(explain))
            return BadRequest('Explain must be "true" or "false" if set');
        else explain = explain === 'true' || undefined;
        // only apply skip when valid
        if (!isNaN(skip) && parseInt(skip) === Number(skip) && skip >= 0)
            skip = parseInt(skip)
        else if (!!skip)
            return BadRequest('Skip must be a non-negative integer if set');
        // only apply limit when valid
        if (!isNaN(limit) && parseInt(limit) === Number(limit) && limit > 0)
            limit = parseInt(limit)
        else if (!!limit && limit !== '0')
            return BadRequest('Limit must be a positive integer if set');
        // parse the find filter and translate it before sending to db for execution
        find = deepmerge.all([{}, this.translate(qry, true), this.translate(qry.conditions), this.translate(qry.find), this.translate(find)]);
        // turn select into projection object
        select = this.transpose(select);
        // check distinct aliased fields
        if (!!distinct)
            distinct = Object.keys(this.transpose(distinct)).pop();
        if (this.select[distinct] === 0)
            return Forbidden('You may not find distinct values for the requested path');
        let selection = [this.select, select].map(s => [...new Set(Object.values(s))].join('')).toString();
        // check default (de)selection criteria
        switch (selection) {
            // if no selection been made then set to default selection
            case '0,': case '1,': case '01,': select = this.select; break;
            // merge default selection when exclusive whilst query selection is exclusive too
            case '0,0': Object.assign(select, this.select); break;
            // disallow selection of deselected fields
            case '0,1':
                if (Object.keys(select).some(k => k[0] === '+' || Object.keys(this.select).includes(k)))
                    return Forbidden('Including excluded fields is not permitted');
                break;
        }
        // deselect the _id attribute according to schema options
        opt = this.model.schema.options;
        if (opt._id === false || (this.model.schema.path('_id') || { options: {} }).options.select === false)
            select = Object.assign({ _id: 0 }, select);
        // apply lean when possible
        opt = opt.toJSON || opt.toObject || {};
        lean = lean || !(opt.virtuals || opt.getters || opt.transform);
        // reset parameters values representing empty objects
        if (find instanceof Object && Object.keys(find).length === 0)
            find = undefined;
        if (sort instanceof Object && Object.keys(sort).length === 0)
            sort = undefined;
        if (select instanceof Object && Object.keys(select).length === 0)
            select = undefined;
        return { find, select, limit, skip, count, distinct, sort, explain, lean, aggregate }
    }
    /**
     * @param {Object} qry the request query object to adjust the query accordingly
     * @param {Object} res optionl response object to write the results into
     * @param {Object} opt extra options object for explicit query overrides
     * @returns {Query} the mongoose query object returned for undefined response
     */
    query(qry, res, opt = {}) {
        try {
            opt = this.params(qry.query || qry, opt);
            if (opt instanceof Error)
                return res.send(opt);
            let { find, select, limit, skip, count, distinct, sort, explain, lean, aggregate } = opt;
            if (Array.isArray(aggregate))
                return this.aggregate(qry, res, ...aggregate);
            // construct query object
            qry = this.model.find(find).select(select).sort(sort);
            if (lean)
                qry.lean({ autopopulate: true, defaults: true });
            if (!res) return qry;
            if (!!distinct)
                qry.distinct(distinct).then(out => res.send(count ? Array.isArray(out) ? out.length : out : sort === distinct ? out.sort() : out)).catch(res.send);
            else if (count)
                qry.countDocuments().then(res.send).catch(res.send);
            else {
                // only apply skip when valid
                if (skip > 0)
                    qry.skip(skip);
                // only apply limit when valid
                if (limit > 0)
                    qry.limit(limit);
                // check for explain option and force lean as the explain results doesn't conform to schema
                if (explain)
                    qry.lean().explain();
                // pipe query results into the response stream
                let cur = qry.cursor();
                cur.on('error', ex => ex.message === 'Cursor is exhausted' ? res.end() : res.send(BadRequest(ex.message)));
                cur.pipe(res.send(!explain && limit !== 1));
            }
        } catch (ex) {
            if (res) return res.send(BadRequest(ex.message));
            error(ex);
            throw ex;
        }
    }
    /**
     * @param {Object} qry the request query object to adjust the query accordingly
     * @param {Object} res optionl response object to write the results into
     * @param {Object} opt extra options object for explicit query overrides
     * @returns {Query} the mongoose query object returned for undefined response
     */
    aggregate(qry, res, ...pipeline) {
        try {
            qry = this.params(qry.query || qry);
            if (qry instanceof Error)
                return res.send(qry);
            let { find, select, limit, skip, count, distinct, sort, explain, lean } = qry;
            qry = this.model.aggregate(pipeline);
            // only apply query find after the predefined aggregate pipeline
            if (find)
                qry.match(find);
            // only apply sort when there is value
            if (sort)
                qry.sort(sort);
            // only apply distinct when there is value
            if (!!distinct)
                qry.group({ _id: null, out: { $addToSet: `$${distinct}` } })
            // only apply select when there is value and no distinct value
            else if (select)
                qry.project(select);
            // only apply count when true
            if (count)
                qry.group({ _id: null, out: { $sum: 1 } })
            // only apply skip when valid
            if (skip >= 0)
                qry.skip(skip)
            // only apply limit when valid
            if (limit > 0)
                qry.limit(limit)
            qry = this.model.aggregate(qry.pipeline(), { explain, allowDiskUse: true })
            if (!res) return qry;
            qry = qry.cursor({ batchSize: 100 })
            // pipe query results into the response stream
            qry.on('error', ex => ex.message === 'Cursor is exhausted' ? res.end() : res.send(BadRequest(ex.message)));
            if (count || !!distinct)
                qry.next().then(doc => {
                    let { out = [] } = doc || {};
                    res.send(count ? Array.isArray(out) ? out.length : out : sort === distinct ? out.sort() : out)
                }).catch(res.send)
            else if (!lean && !explain)
                qry.pipe(new Transform({
                    objectMode: true, transform: (doc, enc, cb) =>
                        (doc = new this.model(doc)).schema.s.hooks.execPost('find', doc, [doc], cb)
                })).pipe(res.send(true))
            else qry.pipe(res.send(!explain))
        } catch (ex) {
            if (res) return res.send(BadRequest(ex.message));
            error(ex);
            throw ex;
        }
    }
    /**
     * transform request body into mongodb update object
     * @param {Object} bodu the request body object
     * @returns {Object} the mongoose update object
     */
    body(body, update = false) {
        if (!body || Array.isArray(body) || Object.keys(body).length === 0)
            return Promise.reject('The request body must contain exactly one document');
        if (update)
            body = Object.entries(body).reduce((o, [k, v]) => {
                if (k[0] === '$') o[k] = v;
                else if ([null, undefined].includes(v)) o.$unset[k] = v;
                else if (v[0] === '$') o.$rename[k] = v.substr(1);
                else o.$set[k] = v;
                return o;
            }, { $set: {}, $unset: {}, $rename: {} });
        return Promise.resolve(body);
    }
    // #endregion
    // #region plural operations
    /**
     * GET http method implementation for plural endpoints
     * @see https://mongoosejs.com/docs/api/query.html#query_Query-find
     * @param {ServerRequest} req http server resquest object
     * @param {ServerResponse} res http server response object
     */
    find(req, res, opts = {}) {
        this.query(req.query, res, Object.keys(opts).length > 0 ? opts : undefined);
    }
    /**
     * DELETE http method implementation for plural endpoints
     * @see https://mongoosejs.com/docs/api/query.html#query_Query-deleteMany
     * @param {ServerRequest} req http server request object
     * @param {ServerResponse} res http server response object
     */
    deleteMany(req, res, opts = {}) {
        let qry = this.query(req.query, undefined, Object.keys(opts).length > 0 ? opts : undefined);
        if (Object.keys(qry._conditions).length === 0)
            return res.send(Forbidden('Must specify find criteria for the requested operation'));
        qry.deleteMany()
            .then(out => res.send(out.deletedCount || undefined))
            .catch(err => res.send(BadRequest(err.message || err)));
    }
    /**
     * PATCH http method implementation for plural endpoints
     * @see https://mongoosejs.com/docs/api/query.html#query_Query-updateMany
     * @param {ServerRequest} req http server request object
     * @param {ServerResponse} res http server response object
     */
    updateMany(req, res, opts = {}) {
        let qry = this.query(req.query, undefined, Object.keys(opts).length > 0 ? opts : undefined);
        if (Object.keys(qry._conditions).length === 0)
            return res.send(Forbidden('Must specify find criteria for the requested operation'));
        this.body(req.body, true).then(doc => qry.updateMany(doc))
            .then(out => res.send(out.modifiedCount || undefined))
            .catch(err => res.send(UnprocessableEntity(err.message || err)));
    }
    /**
     * PUT http method implementation for plural endpoints
     * @see https://mongoosejs.com/docs/api/query.html#query_Query-replaceOne
     * @param {ServerRequest} req http server request object with [request.params.id] present
     * @param {ServerResponse} res http server response object
     */
    replaceMany(req, res) {
        let url = (req.originalUrl || req.url).split(/\/$|\?/).shift();
        if (Object.keys(req.body || {}).length === 0)
            return res.send(UnprocessableEntity('The request body must contain at least one document'));
        let _id = Object.keys(this.translate({ [this._id]: this._id }))[0];
        let ids = [];
        let nInserted = 0;
        let ordered = !Array.isArray(req.body) || req.body.length === 1;
        this.model.insertMany(req.body, { ordered })
            .then(out => ({ modifiedCount: (ids = out.map(o => o.get(_id))).length }))
            .catch(err => {
                // E11000 duplicate key error
                if (err.code !== 11000) throw err;
                let { result } = err.result;
                nInserted = result.nInserted;
                ids = ids.concat(result.writeErrors.map(({ err }) => err.op._id).filter(id => !!id));
                let updates = result.writeErrors.map(({ err }) => ({ replaceOne: { filter: { _id: err.op._id }, replacement: err.op } }));
                return this.model.bulkWrite(updates, { ordered });
            })
            .then(out => nInserted += out.modifiedCount)
            .then(count => res.set('Location', Array.isArray(req.body) ?
                `${url}?${_id}=${ids.map(encodeURIComponent)}&limit=${ids.length}` : `${url}/${ids.pop()}`)
                .status(count > 0 ? 201 : 200).send(count))
            .catch(err => res.send(UnprocessableEntity(err.message || err)));
    }
    /**
     * POST http method implementation for plural endpoints
     * @see https://mongoosejs.com/docs/api/model.html#model_Model.insertMany
     * @param {ServerRequest} req http server request object
     * @param {ServerResponse} res http server response object
     */
    insertMany(req, res) {
        let url = (req.originalUrl || req.url).split(/\/$|\?/).shift();
        if (Object.keys(req.body || {}).length === 0)
            return res.send(UnprocessableEntity('The request body must contain at least one document'));
        let _id = Object.keys(this.translate({ [this._id]: this._id }))[0];
        this.model.insertMany(req.body)
            .then(out => res.set('Location', Array.isArray(req.body) ?
                `${url}?${_id}=${out.map(o => encodeURIComponent(o.get(_id)))}&limit=${out.length}` :
                `${url}/${(out = out.pop()).get(_id)}`)
                .status(201).send(Array.isArray(req.body) ? out.length : 1))
            .catch(err => res.send(UnprocessableEntity(err.message || err)));
    }
    // #endregion
    // #region singular operations
    /**
     * GET http method implementation for singular endpoints
     * @see https://mongoosejs.com/docs/api/query.html#query_Query.findOne
     * @param {ServerRequest} req http server request object with [request.params.id] present
     * @param {ServerResponse} res http server response object
     */
    findById(req, res, opts = {}) {
        this.query(req.query, undefined, Object.keys(opts).length > 0 ? opts : { find: { [this._id]: req.params.id } })
            .findOne()
            .then(doc => {
                let count = doc ? 1 : 0;
                if (!!req.query.distinct) {
                    doc = doc[req.query.distinct];
                    doc = doc === undefined ? [] : Array.isArray(doc) ? [...new Set(doc)] : [doc];
                    count = doc.length;
                }
                res.send(req.query.count === 'true' ? count : doc || undefined);
            })
            .catch(err => res.send(BadRequest(err.message || err)));
    }
    /**
     * DELETE http method implementation for singular endpoints
     * @see https://mongoosejs.com/docs/api/query.html#query_Query.deleteOne
     * @param {ServerRequest} req http server request object with [request.params.id] present
     * @param {ServerResponse} res http server response object
     */
    findByIdAndDelete(req, res, opts = {}) {
        this.query(req.query, undefined, Object.keys(opts).length > 0 ? opts : { find: { [this._id]: req.params.id } })
            .deleteOne()
            .then(out => res.send(out.deletedCount || undefined))
            .catch(err => res.send(BadRequest(err.message || err)));
    }
    /**
     * PATCH http method implementation for singular endpoints
     * @see https://mongoosejs.com/docs/api/query.html#query_Query.updateOne
     * @param {ServerRequest} req http server request object with [request.params.id] present
     * @param {ServerResponse} res http server response object
     */
    findByIdAndUpdate(req, res, opts = {}) {
        this.body(req.body, true).then(doc => this
            .query(req.query, undefined, Object.keys(opts).length > 0 ? opts : { find: { [this._id]: req.params.id } })
            .updateOne(doc))
            .then(out => res.send(out.modifiedCount || undefined))
            .catch(err => res.send(UnprocessableEntity(err.message || err)));
    }
    /**
     * PUT http method implementation for singular endpoints
     * @see https://mongoosejs.com/docs/api/query.html#query_Query-replaceOne
     * @param {ServerRequest} req http server request object with [request.params.id] present
     * @param {ServerResponse} res http server response object
     */
    findByIdAndReplace(req, res, opts = {}) {
        this.body(req.body).then(doc => this
            .query(req.query, undefined, Object.keys(opts).length > 0 ? opts : { find: { [this._id]: req.params.id } })
            .replaceOne(doc))
            .then(out => res.status(200).send(out.modifiedCount || undefined))
            .catch(err => res.send(UnprocessableEntity(err.message || err)));
    }
    // #endregion
}

export default Controller;