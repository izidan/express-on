const supertest = require('supertest');
const fixture = require('./fixtures/vegetable');

describe.skip('GET hint', () => {
    beforeAll(fixture.init);
    afterAll(fixture.deinit);
    beforeEach(fixture.create);
    const request = () => supertest(fixture.app());

    it('should report bad hints', () =>
        request().get('/api/vegetables?hint={ "foogle": 1 }')
            .expect(400, /"message":"The requested query hint is invalid"/));

    it('allow using hint with count', () =>
        request().get('/api/vegetables?count=true&hint={ "_id": 1 }')
            .expect(200, '8'));

    it('allows adding index hint', () =>
        request().get('/api/vegetables?hint={ "_id": 1 }')
            .expect(200));

    it('allows adding index hint', () =>
        request().get('/api/vegetables?hint[_id]=1')
            .expect(200));

    it('allows using comment with count', () =>
        request().get('/api/vegetables?count=true&comment=salve')
            .expect(200, '8'));

    it('allows adding a query comment', () =>
        request().get('/api/vegetables?comment=testing testing 123')
            .expect(200));

    it('should not allow adding an index hint if not enabled', () =>
        request().get('/api/fungi?hint={ "_id": 1 }')
            .expect(403, /"message":"Hints are not enabled for this resource"/));
});