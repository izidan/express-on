/**
 * Base controller class where other controller inherits or
 * overrides pre defined and existing properties
 */
class Controller {
    /**
     * @param {Model} model The default model object for the controller.
     * Will be required to create an instance of the controller
     */
    constructor(model) {
        this.limit = 10;
        this.model = model;
    }
    /**
     * @param {Object} qry The query object to translate aliases from
     * @param {Boolean} strict Flag to remove query fields not mapped to schema
     * @return {Object} The translated object
     */
    translate(qry, strict) {
        let val;
        qry = qry.constructor === String ? JSON.parse(qry) : Object.assign({}, qry);
        qry = this.model.translateAliases(qry);
        if (strict === true)
            for (let key in qry)
                if (this.model.schema.path(key))
                    if ((val = qry[key]).split && (val = val.split(/,|;/)).length > 1)
                        qry[key] = { $in: val };
                    else continue;
                else delete qry[key];
        return qry;
    }
    /**
     * @param {Object} qry The query object
     * @param {Object} res The response object
     * @param {Object} options Extra options object
     * @param {Object} res The query overrides object
     */
    query(qry, res, options = {}) {
        options = Object.assign(qry, options);
        let { find = {}, select = '', limit = this.limit, skip = 0, count = false, sort } = options;
        find = Object.assign({}, this.translate(qry, true), this.translate(find));
        // parse the find filter and translate it before sending to db for execution
        options = this.model.schema.options;
        // deselect the _id attribute according to schema options
        if (options._id === false || this.model.schema.path('_id').options.select === false)
            select = select.constructor === String ? '-_id ' + select : Object.assign(select, { _id: 0 });
        // construct query object
        qry = this.model.find(find).select(select).sort(sort);
        // apply lean whe possible
        if (!(options.virtuals || options.getters || options.transform))
            qry.lean({ autopopulate: true, defaults: true });
        if (!!count && JSON.parse(count) === true)
            qry.countDocuments((err, count) => err ? res.status(500).send(err) : res.send(count));
        else
            // pipe query results into the response stream
            qry.skip(parseInt(skip))
                .limit(parseInt(limit))
                .cursor()
                .pipe(res.send(limit !== 1));
    }
    /**
     * @param {Object} req The request object
     * @param {Object} res The response object
     * @param {function} next The callback to the next program handler
     * @return {Object} res The response object
     */
    getAll(req, res) {
        this.query(req.query, res)
    }
    /**
     * @param {Object} req The request object
     * @param {Object} res The response object
     * @param {function} next The callback to the next program handler
     * @return {Object} res The response object
     */
    getById(req, res) {
        this.query(req.query, res, { find: { _id: req.params.id }, limit: 1 })
    }
}

module.exports = Controller;