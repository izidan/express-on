const supertest = require('supertest');
const mongoose = require('mongoose');
let infos = [];
let server;

describe('Command line', () => {
    beforeAll(() => {
        console.info = info => infos.push(info);
        process.env.MONGO_URI = global.__MONGO_URI__;
        process.env.PORT = 12345;
        server = require('../');
    });
    afterAll((done) => {
        delete process.env.PORT;
        delete process.env.MONGO_URI;
        server.close(() => mongoose.disconnect(done));
    });
    const request = () => supertest(server);

    it("should listen on the specifid port", () =>
        request().get('/').expect(200, { test: '12345' }));

    it("should connect to mongodb", () => expect(mongoose.connection.readyState).toEqual(1));

    it("should have logged some info via console.info", () => expect(infos).not.toHaveLength(0));

});
