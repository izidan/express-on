const supertest = require('supertest');
const fixture = require('./fixtures/countries');

describe('aggregations', () => {
    beforeAll(fixture.init);
    afterAll(fixture.deinit);
    const request = () => supertest(fixture.app());

    it('should reject empty aggregate object', () =>
        request().get('/api/countries?aggregate={}')
            .expect(400));

    it('should reject empty aggregate array', () =>
        request().get('/api/countries?aggregate=[]')
            .expect(400));

    it('should support aggregate object', () =>
        request().get('/api/countries?aggregate={"$group":{"_id":"$continent","count":{"$sum":1}}}')
            .expect(200)
            .then(({ body }) => expect(body).toHaveLength(8)));

    it('should support aggregate with count', () =>
        request().get('/api/countries?aggregate={"$group":{"_id":"$continent","count":{"$sum":1}}}&count=true')
            .expect(200, '8'));

    it('should support aggregate with zero count', () =>
        request().get('/api/countries?aggregate={"$group":{"_id":"$continent","count":{"$sum":1}}}&find={"_id":"anything"}&count=true')
            .expect(200, '0'))

    it('should support aggregate array', () =>
        request().get('/api/countries?aggregate=[{"$group":{"_id":"$continent","count":{"$sum":1}}},{"$sort":{"_id":1}}]')
            .expect(200)
            .then(({ body }) => expect(body).toStrictEqual([
                { "_id": null, "count": 1 },
                { "_id": "AF", "count": 58 },
                { "_id": "AN", "count": 5 },
                { "_id": "AS", "count": 52 },
                { "_id": "EU", "count": 52 },
                { "_id": "NA", "count": 41 },
                { "_id": "OC", "count": 27 },
                { "_id": "SA", "count": 14 },
            ])));

    it('should support multiple aggregate params', () =>
        request().get('/api/countries?aggregate={"$group":{"_id":"$continent","count":{"$sum":1}}}&aggregate={"$sort":{"_id":1}}')
            .expect(200)
            .then(({ body }) => expect(body).toStrictEqual([
                { "_id": null, "count": 1 },
                { "_id": "AF", "count": 58 },
                { "_id": "AN", "count": 5 },
                { "_id": "AS", "count": 52 },
                { "_id": "EU", "count": 52 },
                { "_id": "NA", "count": 41 },
                { "_id": "OC", "count": 27 },
                { "_id": "SA", "count": 14 },
            ])));

    it('should support aggregate with sort', () =>
        request().get('/api/countries?aggregate={"$group":{"_id":"$continent","count":{"$sum":1}}}&sort=_id')
            .expect(200)
            .then(({ body }) => expect(body).toStrictEqual([
                { "_id": null, "count": 1 },
                { "_id": "AF", "count": 58 },
                { "_id": "AN", "count": 5 },
                { "_id": "AS", "count": 52 },
                { "_id": "EU", "count": 52 },
                { "_id": "NA", "count": 41 },
                { "_id": "OC", "count": 27 },
                { "_id": "SA", "count": 14 },
            ])));

    it('should support aggregate with find', () =>
        request().get('/api/countries?aggregate={"$group":{"_id":"$continent","count":{"$sum":1}}}&sort=_id&find={"_id":{"$in":["AF","AN","AS"]}}')
            .expect(200)
            .then(({ body }) => expect(body).toStrictEqual([
                { "_id": "AF", "count": 58 },
                { "_id": "AN", "count": 5 },
                { "_id": "AS", "count": 52 },
            ])));

    it('should support aggregate with find and count', () =>
        request().get('/api/countries?aggregate={"$group":{"_id":"$continent","count":{"$sum":1}}}&count=true&find={"_id":{"$in":["AF","AN","AS"]}}')
            .expect(200, '3'));

    it('should support aggregate with select', () =>
        request().get('/api/countries?aggregate={"$group":{"_id":"$continent","count":{"$sum":1}}}&sort=_id&select=-_id')
            .expect(200)
            .then(({ body }) => expect(body).toStrictEqual([
                { "count": 1 },
                { "count": 58 },
                { "count": 5 },
                { "count": 52 },
                { "count": 52 },
                { "count": 41 },
                { "count": 27 },
                { "count": 14 },
            ])));

    it('should support aggregate with distinct', () =>
        request().get('/api/countries?aggregate={"$group":{"_id":"$continent","count":{"$sum":1}}}&distinct=_id&sort=_id')
            .expect(200)
            .then(({ body }) => expect(body).toStrictEqual(["AF", "AN", "AS", "EU", "NA", "OC", "SA", null])));

    it('should support aggregate with distinct and select', () =>
        request().get('/api/countries?aggregate={"$group":{"_id":"$continent","count":{"$sum":1}}}&distinct=_id&select=-_id&sort=_id')
            .expect(200)
            .then(({ body }) => expect(body).toStrictEqual(["AF", "AN", "AS", "EU", "NA", "OC", "SA", null])));

    it('allows explain on plurals aggregate', () =>
        request().get('/api/countries?aggregate={"$group":{"_id":"$continent","count":{"$sum":1}}}&explain=true')
            .expect(200)
            .then(({ body }) => {
                expect(body).toHaveProperty('stages');
                expect(body).toHaveProperty('serverInfo');
                expect(body.stages[0]).toHaveProperty('$cursor');
                expect(body.stages[0].$cursor).toHaveProperty('queryPlanner');
                expect(body.stages[0].$cursor).toHaveProperty('executionStats');
            }));
})