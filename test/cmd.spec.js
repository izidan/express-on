import mongoose from 'mongoose';
import supertest from 'supertest';

let infos = [];
let server;

describe('Command line', () => {
    beforeAll(async () => {
        console.info = info => infos.push(info);
        process.env.MONGO_URI = global.__MONGO_URI__ + global.__MONGO_DB_NAME__;
        process.env.PORT = 12345;
        server = (await import('../index.js')).default;
    });
    afterAll(done => {
        delete process.env.PORT;
        delete process.env.MONGO_URI;
        server.close(() => mongoose.disconnect().then(done));
    });
    const request = () => supertest(server);

    it("should listen on the specifid port", () =>
        request().get('/').expect(200, { test: '12345' }));

    it("should connect to mongodb", () => expect(mongoose.connection.readyState).toEqual(1));

    it("should have logged some info via console.info", () => expect(infos).not.toHaveLength(0));

});
