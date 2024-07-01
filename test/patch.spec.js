import supertest from 'supertest';
import fixture from './fixtures/vegetable.js';

describe('PATCH singular', () => {
    beforeAll(fixture.init);
    afterAll(fixture.deinit);
    beforeEach(fixture.create);
    const request = () => supertest(fixture.app());

    it("should update (set, unset, rename) the addressed object if it exists", () => {
        let radicchio = fixture.vegetables[7];
        return request().get('/api/vegetables/' + radicchio._id)
            .expect(200)
            .then(({ body }) => {
                expect(body).toHaveProperty('name', 'Radicchio');
                // patch the leek on the server
                return request().patch('/api/vegetables/' + radicchio._id)
                    .send({ tasty: true, related: null, nutrients: '$nutrition' })
                    .expect(200, '1')
                    .then(({ headers }) => {
                        expect(headers).not.toHaveProperty('location');
                        return request().get('/api/vegetables/' + radicchio._id)
                            .expect(200)
                            .then(({ body }) => {
                                expect(body).not.toHaveProperty('nutrients');
                                expect(body).not.toHaveProperty('related');
                                expect(body).toHaveProperty('tasty', true);
                                expect(body).toHaveProperty('nutrition');
                                expect(body.nutrition).toHaveLength(1);
                            })
                    });
            });
    });

    it("should 422 on no document", () => {
        let radicchio = fixture.vegetables[7];
        return request().get('/api/vegetables/' + radicchio._id)
            .expect(200)
            .then(({ body }) => {
                expect(body).toHaveProperty('name', 'Radicchio');
                // patch the leek on the server
                return request().patch('/api/vegetables/' + radicchio._id)
                    .expect(422, /"message":"The request body must contain exactly one document"/)
            });
    });

    it("should 422 on multiple documents", () => {
        let radicchio = fixture.vegetables[7];
        return request().get('/api/vegetables/' + radicchio._id)
            .expect(200)
            .then(({ body }) => {
                expect(body).toHaveProperty('name', 'Radicchio');
                // patch some veggies on the server
                return request().patch('/api/vegetables/' + radicchio._id)
                    .send([{ name: 'Pea Shoot' }, { name: 'Bitter Melon' }])
                    .expect(422, /"message":"The request body must contain exactly one document"/)
            });
    });

    it('should only allow updates on existing documents', () => {
        let id = 'badbadbadbadbadbadbadbad';
        // First check it's not there
        return request().get('/api/vegetables/' + id)
            .expect(404)
            .then(() =>
                // Attempt to update non-existant doc
                request().patch('/api/vegetables/' + id)
                    .send({ name: 'Cucumber' })
                    .expect(404, /"message":"Not Found"/)
                    .then(() =>
                        // Make sure it wasn't created
                        request().get('/api/vegetables/' + id)
                            .expect(404)
                    )
            );
    });
});