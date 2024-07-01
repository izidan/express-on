import supertest from 'supertest';
import fixture from './fixtures/vegetable.js';

describe('DELETE singular', () => {
  beforeAll(fixture.init);
  afterAll(fixture.deinit);
  beforeEach(fixture.create);
  const request = () => supertest(fixture.app());

  it('should delete the addressed document', () => {
    let shitake = fixture.vegetables[3];
    return request().del('/api/vegetables/' + shitake._id)
      .expect('Content-Type', /json/)
      .expect(200, '1') // count of deleted objects
      .then(() =>
        request().del('/api/vegetables/' + shitake._id)
          .expect(404, /"message":"Not Found"/))
  });

  xit('should invoke "remove" middleware', () => {
    let shitake = fixture.vegetables[3];
    return request().del('/api/vegetables/' + shitake._id)
      .then(() => expect(fixture).toHaveProperty('removeCount', 1))
  });

});
