import supertest from 'supertest';
import fixture from './fixtures/vegetable.js';

describe('PATCH plural accept', () => {
    beforeAll(fixture.init);
    afterAll(fixture.deinit);
    beforeEach(fixture.create);
    const request = () => supertest(fixture.app());

    it("should update the addressed xml objects if exists", () => {
        return request().get('/api/vegetables/')
            .query({ count: true, related: { $exists: true }, nutrients: { $size: 1 } })
            .expect(200, '8')
            .then(() => request().patch('/api/vegetables/')
                .query({ related: { $exists: true } })
                .set('Content-type', 'application/xml')
                .send('<object><tasty>true</tasty><related>null</related><nutrients>$nutrition</nutrients></object>')
                .expect(200, '8')
                .then(() => request().get('/api/vegetables/')
                    .query({
                        nutrients: { $exists: false },
                        related: { $exists: false },
                        nutrition: { $size: 1 },
                        tasty: true,
                        count: true,
                    })
                    .expect(200, '8')
                ));
    });

    it("should 422 on no document", () => {
        return request().patch('/api/vegetables/').accept('text/xml')
            .query({ related: { $exists: true } })
            .expect(422, /<message>The request body must contain exactly one document<\/message>/)
    });

    it("should 422 on multiple documents", () => {
        return request().patch('/api/vegetables/').accept('text/xml')
            .query({ related: { $exists: true } })
            .set('Content-type', 'application/xml')
            .send('<xml><object><name>Pea Shoot</name></object><object><name>Bitter Melon</name></object></xml>')
            .expect(422, /<message>The request body must contain exactly one document<\/message>/)
    });

    it("should update (set, unset, rename) the addressed object if it exists", () => {
        let radicchio = fixture.vegetables[7];
        return request().get('/api/vegetables/' + radicchio._id)
            .expect(200)
            .then(({ body }) => {
                expect(body).toHaveProperty('name', 'Radicchio');
                // patch the leek on the server
                return request().patch('/api/vegetables/' + radicchio._id)
                    .set('Content-type', 'application/xml')
                    .send('<object><tasty>true</tasty><related>null</related><nutrients>$nutrition</nutrients></object>')
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
                return request().patch('/api/vegetables/' + radicchio._id).accept('text/xml')
                    .expect(422, /<message>The request body must contain exactly one document<\/message>/)
            });
    });

    it("should 422 on multiple documents", () => {
        let radicchio = fixture.vegetables[7];
        return request().get('/api/vegetables/' + radicchio._id)
            .expect(200)
            .then(({ body }) => {
                expect(body).toHaveProperty('name', 'Radicchio');
                // patch some veggies on the server
                return request().patch('/api/vegetables/' + radicchio._id).accept('text/xml')
                    .set('Content-type', 'application/xml')
                    .send('<xml><object><name>Pea Shoot</name></object><object><name>Bitter Melon</name></object></xml>')
                    .expect(422, /<message>The request body must contain exactly one document<\/message>/)
            });
    });

    it('should only allow updates on existing documents', () => {
        let id = 'badbadbadbadbadbadbadbad';
        // First check it's not there
        return request().get('/api/vegetables/' + id)
            .expect(404)
            .then(() =>
                // Attempt to update non-existant doc
                request().patch('/api/vegetables/' + id).accept('text/xml')
                    .set('Content-type', 'application/xml')
                    .send('<object><name>Cucumber</name></object>')
                    .expect(404, /<message>Not Found<\/message>/)
                    // Make sure it wasn't created
                    .then(() => request().get('/api/vegetables/' + id)
                        .expect(404)));
    });
});