`Express-on` is a minimal MVC framework to easily turn mongodb collections into fully fledged RESTful services supporting all http verbs.

>[Express](https://expressjs.com) is the http framwork used to handle the REST service request/response using [Mongoose](https://mongoosejs.com/) as the ORM layer on top of [mongodb](https://mongodb.com) and binds the http verbs to the [Query](https://mongoosejs.com/docs/api/query.html) operations.


HTTP Verbs
-----
* GET binds to [Query.find](https://mongoosejs.com/docs/api/query.html#query_Query-find)
* DEL binds to [Query.deleteMany](https://mongoosejs.com/docs/api/query.html#query_Query-deleteMany)
* PUT binds to [Query.replaceOne](https://mongoosejs.com/docs/api/query.html#query_Query-replaceOne)
* POST binds to [Model.insertMany](https://mongoosejs.com/docs/api/model.html#model_Model.insertMany)
* PATCH binds to [Query.updateMany](https://mongoosejs.com/docs/api/query.html#query_Query-updateMany)

MVC Pattern
-----
* `models` folder contains the mongoose schemas/models that defines the object modelling for the document resides in an underlying mongodb collection, it is also used for document level validation and any other mongoose specific hooks as per the [Document](https://mongoosejs.com/docs/api/document.html) api, more on [mongoose schemas](https://mongoosejs.com/docs/guide.html)
* `routes` folders containes the http routes binding for different verbs to the underlying controllers method passing the http request query params along the request. more on [Express router](https://expressjs.com/en/4x/api.html#router)
* `controllers` folder containes the business logic needed for each operation pre submitting the operation to mongodb by simply overrding any of base *Controller* implementation

Controller Class
----
>`Controller` class is a base class with a constructor that takes the mongoose `Model` as the only parameter, and implements the following methods that can be overriden to implement any custom logic, checks, etc
* [find](https://mongoosejs.com/docs/api/query.html#query_Query-find)
* [insertMany](https://mongoosejs.com/docs/api/model.html#model_Model.insertMany)
* [deleteMany](https://mongoosejs.com/docs/api/query.html#query_Query-deleteMany)
* [updateMany](https://mongoosejs.com/docs/api/query.html#query_Query-updateMany)
* [replaceMany](https://mongoosejs.com/docs/api/query.html#query_Query-replaceOne)
* [findById](https://mongoosejs.com/docs/api/query.html#query_Query.findOne)
* [findByIdAndDelete](https://mongoosejs.com/docs/api/query.html#query_Query.deleteOne)
* [findByIdAndUpdate](https://mongoosejs.com/docs/api/query.html#query_Query.updateOne)
* [findByIdAndReplace](https://mongoosejs.com/docs/api/query.html#query_Query-replaceOne)

>`Controller` class implementation for the methods also handles the following query parameters that might present in the request url and invokes the relevant mongoose [Query](https://mongoosejs.com/docs/api/query.html) method
* [find](https://mongoosejs.com/docs/api/query.html#query_Query-find)=`{Object}`  specifies the mongodb selector. If not specified, returns all documents.
* [limit](https://mongoosejs.com/docs/api/query.html#query_Query-limit)=`Number` specifies the maximum number of documents the query will return, defaults to 10, and return all when explicitly set to 0.
* [skip](https://mongoosejs.com/docs/api/query.html#query_Query-skip)=`Number` specifies the number of documents to skip. useful for pagination when combined with limit.
* [count](https://mongoosejs.com/docs/api/query.html#query_Query-count)=`Boolean` set to **`true`** to count documents matching the mongodb selector if specified, otherwise returns the total count of documents
* [distinct](https://mongoosejs.com/docs/api/query.html#query_Query-distinct)=`String` specifies a single path to get the distict values of.
* [sort](https://mongoosejs.com/docs/api/query.html#query_Query-sort)=`String` sets the sort order, it must be a space delimited list of path names. The sort order of each path is ascending unless the path name is prefixed with `-` which will be treated as descending.
* [select](https://mongoosejs.com/docs/api/query.html#query_Query-select)=`String` specifies which document fields to include or exclude, prefixing a path with `-` will flag that path as excluded. When a path does not have the - prefix, it is included.


Express Router
----
Express routers is used to bind the http requests to the underlying controller that implements the requested operation, example


Getting Started
---
Install with peer dependencies:
>npm install --save express

>npm install --save mongoose

>npm install --save express-on

Edit package.json to add start script:
```
  "main": "node_modules/express-on",
  "scripts": {
    "start": "node_modules/.bin/express-on"
  }
```
Create `models\currencies.js` with a basic Mongoose model:
```
import mongoose from 'mongoose'
let schema = new mongoose.Schema({
    _id: String,
    name: String,
    country: String
});
export default mongoose.model('currency', schema,'currencies');
```
Create `controllers\currencies.js` with a basic controller
```
import Model from '../models/currencies.js';
import { Controller } from 'express-on';

class CurrenciesController extends Controller {
    constructor() {
        super(Model)
    }
}

module.exports = CurrenciesController;
```

Create `routers\index.js` to bind http routes to controller methods
```
const Controller = require('../controllers/currencies');
const { Router } = require('express');

const controller = new Controller();
const router = Router();

router.delete('/currencies/:id', controller.findByIdAndDelete.bind(controller));
router.patch('/currencies/:id', controller.findByIdAndUpdate.bind(controller));
router.put('/currencies/:id', controller.findByIdAndReplace.bind(controller));
router.get('/currencies/:id', controller.findById.bind(controller));

router.delete('/currencies/', controller.deleteMany.bind(controller));
router.patch('/currencies/', controller.updateMany.bind(controller));
router.post('/currencies/', controller.insertMany.bind(controller));
router.put('/currencies/', controller.replaceMany.bind(controller));
router.get('/currencies/', controller.find.bind(controller));

module.exports = router;
```
Configure mongodb connection string:
>set MONGO_URI=mongodb://localhost/test

Configure http port to listen on:
>set PORT=80

Start via
>npm start