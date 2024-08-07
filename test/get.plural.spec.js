import supertest from 'supertest';
import fixture from './fixtures/vegetable.js';

describe('GET plural', () => {
  beforeAll(fixture.init);
  afterAll(fixture.deinit);
  beforeEach(fixture.create);
  const request = () => supertest(fixture.app());

  it("should return 'em all", () =>
    request().get('/api/vegetables')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }) => {
        expect(body).toHaveLength(8);
        body.forEach((doc, i) => {
          let found = fixture.vegetables.some(vege => vege._id.toString() === doc._id);
          expect(found).toBe(true);
        });
      }));

  it("should return an object for a single document match", () =>
    request().get('/api/vegetables')
      .query({ limit: 1 })
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }) => {
        expect(body).toHaveProperty('_id');
        let found = fixture.vegetables.some(vege => vege._id.toString() === body._id);
        expect(found).toBe(true);
      }));

  it("should send 400 when no documents found with bad query", () =>
    request().get('/api/vegetables')
      .query({ find: { nothing: { $in: "bad" } } })
      .expect(400));

  it("should send 404 when no documents found", () =>
    request().get('/api/vegetables')
      .query({ find: { nothing: true } })
      .expect(404));

  xit("should send 404 when no document found", () =>
    request().get('/api/no-content')
      .expect(404));

  xit("should send 404 when no path found", () =>
    request().get('/api/not-found')
      .expect(404, /Cannot GET \/api\/not-found/));

  it('should not set Location header', () =>
    request().get('/api/vegetables')
      .then(({ headers }) =>
        expect(headers).not.toHaveProperty('location')));

});
