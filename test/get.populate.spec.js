const supertest = require('supertest');
const parselinks = require('parse-link-header');
const fixture = require('./fixtures/vegetable');

describe.skip('GET populate', () => {
    beforeAll(fixture.init);
    afterAll(fixture.deinit);
    beforeEach(fixture.create);
    const request = () => supertest(fixture.app());

    xit('disallows populating deselected fields 1', () =>
        request().get('/api/vegetables?populate=species')
            .expect(403)
            .then(({ body }) => expect(body).toHaveProperty('message', 'Including excluded fields is not permitted'))
    );

    xit('disallows populating deselected fields 2', () =>
        request().get('/api/vegetables?populate={ "path": "species" }')
            .expect(403)
            .then(({ body }) => expect(body).toHaveProperty('message', 'Including excluded fields is not permitted'))
    );

    it('should support default express query parser when using populate', () =>
        request().get('/api/vegetables?populate[path]=species')
            .expect(403)
            .then(({ body }) => expect(body).toHaveProperty('message', 'Including excluded fields is not permitted'))
    );

    it('disallows using +fields with populate', () =>
        request().get('/api/vegetables?populate={ "select": "%2Bboiler" }')
            .expect(403)
            .then(({ body }) => expect(body).toHaveProperty('message', 'Selecting fields of populated documents is not permitted'))
    );

    it('disallows selecting fields when populating', () =>
        request().get('/api/vegetables?populate={ "path": "a", "select": "arbitrary" }')
            .expect(403)
            .then(({ body }) => expect(body).toHaveProperty('message', 'Selecting fields of populated documents is not permitted'))
    );

    it('should not crash when disallowing selecting fields when populating', () =>
        request().get('/api/vegetables?populate=[{ "path": "a", "select": "arbitrary actuary" }, { "path": "b", "select": "arbitrary actuary" }]')
            .expect(403)
            .then(({ body }) => expect(body).toHaveProperty('message', 'Selecting fields of populated documents is not permitted'))
    );

    it('disallows selecting fields when populating', () =>
        request().get('/api/vegetables?populate={ "path": "a", "select": "arbitrary" }')
            .expect(403)
            .then(({ body }) => expect(body).toHaveProperty('message', 'Selecting fields of populated documents is not permitted'))
    );

    it('allows populating children', () =>
        request().get('/api/vegetables/' + fixture.vegetables[0]._id + '/?populate=nutrients')
            .expect(200)
            .then(({ body }) => {
                expect(body).toHaveProperty('nutrients');
                expect(body.nutrients).toHaveLength(1);
                expect(body.nutrients[0]).toHaveProperty('color', 'Blue');
            })
    );
});