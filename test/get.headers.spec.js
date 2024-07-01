import supertest from 'supertest';
import parselinks from 'parse-link-header';
import fixture from './fixtures/vegetable.js';

describe.skip('GET headers link', () => {
    beforeAll(fixture.init);
    afterAll(fixture.deinit);
    beforeEach(fixture.create);
    const request = () => supertest(fixture.app());

    it('allows adding paging links', () =>
        request().get('/api/minerals?limit=2')
            .expect(200)
            .then(({ headers }) => expect(headers).toHaveProperty('link'))
    );

    it('should not return paging links if limit not set', () =>
        request().get('/api/minerals?sort=name')
            .expect(200)
            .then(({ headers }) => {
                expect(headers.link).toContain('rel="self"');
                expect(headers.link).toContain('rel="search"');
                expect(headers.link).not.toContain('rel="first"');
                expect(headers.link).not.toContain('rel="last"');
                expect(headers.link).not.toContain('rel="next"');
                expect(headers.link).not.toContain('rel="previous"');
            })
    );

    it('should not return paging links if relations are not enabled', () =>
        request().get('/api/vegetables')
            .expect(200)
            .then(({ headers }) => expect(headers.link).toBeUndefined())
    );

    it('allows using relations: true with sorted queries', () =>
        request().get('/api/minerals?sort=color&limit=2&skip=2&select=-__v -_id -enables')
            .expect(200, [{ color: 'Indigo' }, { color: 'Orange' }])
            .then(({ headers }) => {
                expect(headers.link).toContain('rel="first"');
                expect(headers.link).toContain('rel="last"');
                expect(headers.link).toContain('rel="next"');
                expect(headers.link).toContain('rel="previous"');
            })
    );

    it('should return next for first page', () =>
        request().get('/api/minerals?limit=2')
            .expect(200)
            .expect('link', /rel="next"/)
    );

    it('should return previous for second page', () =>
        request().get('/api/minerals?limit=2&skip=2')
            .expect(200)
            .expect('link', /rel="previous"/)
    );

    it('should not return paging links previous for first page', () =>
        request().get('/api/minerals?limit=2')
            .expect(200)
            .then(({ headers }) => expect(headers.link).not.toContain('rel="previous"'))
    );

    it('should not return paging links next for last page', () =>
        request().get('/api/minerals?limit=2&skip=6')
            .expect(200)
            .then(({ headers }) => expect(headers.link).not.toContain('rel="next"'))
    );

    it('should not add query string to the search link (collection)', () =>
        request().get('/api/minerals?sort=color')
            .expect(200)
            .expect('link', '</api/minerals>; rel="search", </api/minerals?sort=color>; rel="self"')
    );

    it('should not add query string to the search link (instance)', () =>
        request().get('/api/minerals')
            .expect(200)
            .then(({ body }) => {
                let id = body[0]._id;
                return request().get('/api/minerals/' + id + '?sort=color')
                    .expect(200)
                    .expect('link', '</api/minerals>; rel="collection", </api/minerals>; rel="search", </api/minerals/' + id + '>; rel="edit", </api/minerals/' + id + '>; rel="self"')
            })
    );

    it('should preserve query in paging links', () => {
        let conditions = JSON.stringify({ color: { $regex: '.*e.*' } });
        return request().get('/api/minerals?limit=1&skip=0&conditions=' + conditions)
            .expect(200)
            .expect('link', /rel="next"/)
            .then(({ headers }) => {
                let links = parselinks(headers.link);
                expect(links.next.url).toContain('conditions=' + encodeURIComponent(conditions));
            })
    });

    it('allows retrieving paging links next', () =>
        request().get('/api/minerals?limit=2&skip=0')
            .expect(200)
            .then(({ headers }) => {
                expect(headers).toHaveProperty('link');
                let links = parselinks(headers.link);
                expect(links).toHaveProperty('next');
                return request().get(links.next.url)
                    .expect(200)
            })
    );

    it('allows retrieving paging links previous', () =>
        request().get('/api/minerals?limit=2&skip=2')
            .expect(200)
            .then(({ headers }) => {
                expect(headers).toHaveProperty('link');
                let links = parselinks(headers.link);
                expect(links).toHaveProperty('previous');
                return request().get(links.previous.url)
                    .expect(200)
            })
    );

    it('allows retrieving paging links last', () =>
        request().get('/api/minerals?limit=2&skip=6')
            .expect(200)
            .then(({ headers }) => {
                expect(headers).toHaveProperty('link');
                let links = parselinks(headers.link);
                expect(links).toHaveProperty('first');
                return request().get(links.first.url)
                    .expect(200)
            })
    );

    it('allows retrieving paging links first', () =>
        request().get('/api/minerals?limit=2&skip=0')
            .expect(200)
            .then(({ headers }) => {
                expect(headers).toHaveProperty('link');
                let links = parselinks(headers.link);
                expect(links).toHaveProperty('last');
                return request().get(links.last.url)
                    .expect(200)
            })
    );
});