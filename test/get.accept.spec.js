import supertest from 'supertest';
//import msgpack from 'msgpack-lite';
import fixture from './fixtures/countries.js';

describe('GET accept', () => {
    beforeAll(fixture.init);
    afterAll(fixture.deinit);
    const request = () => supertest(fixture.app());

    it('get count in xml', () =>
        request().get('/api/countries')
            .query({ count: true })
            .accept('text/xml')
            .expect(200, '<number>250</number>'))

    it('get array in xml', () =>
        request().get('/api/countries?select=_id name')
            .query({ limit: 3, sort: '_id' })
            .accept('text/xml')
            .expect(200, '<xml><object id="680"></object><object id="ABW"><name>Aruba</name></object><object id="AFG"><name>Afghanistan</name></object></xml>'))

    it('get object in xml', () =>
        request().get('/api/countries/TWN?select=_id name')
            .accept('text/xml')
            .expect(200, '<object id="TWN"><name>Taiwan</name></object>'))

    it('get distinct values in xml', () =>
        request().get('/api/countries')
            .query({ distinct: 'continent', sort: 'continent' })
            .accept('text/xml')
            .expect(200, '<xml><string>AF</string><string>AN</string><string>AS</string><string>EU</string><string>NA</string><string>OC</string><string>SA</string></xml>'))

    it('get application/xml equals text/xml', () =>
        request().get('/api/countries').query({ limit: 3 })
            .accept('text/xml').expect(200)
            .then(({ body }) => request().get('/api/countries').query({ limit: 3 })
                .accept('application/xml').expect(200, body)));

    it('get count in csv', () =>
        request().get('/api/countries')
            .query({ count: true })
            .accept('text/csv')
            .expect(200, '250\n'))

    it('get array in csv', () =>
        request().get('/api/countries?select=_id name')
            .query({ limit: 3, sort: '_id' })
            .accept('text/csv')
            .expect(200, '_id\n680\n_id,name\nABW,Aruba\nAFG,Afghanistan\n'))

    it('get object in csv', () =>
        request().get('/api/countries/TWN?select=_id name')
            .accept('text/csv')
            .expect(200, '_id,name\nTWN,Taiwan\n'))

    it('get distinct values in csv', () =>
        request().get('/api/countries')
            .query({ distinct: 'continent', sort: 'continent' })
            .accept('text/csv')
            .expect(200, 'AF\nAN\nAS\nEU\nNA\nOC\nSA\n'))

    it('get application/csv equals text/csv equals text/comma-separated-values', () =>
        request().get('/api/countries').query({ limit: 3 })
            .accept('text/csv').expect(200)
            .then(({ body }) => request().get('/api/countries').query({ limit: 3 })
                .accept('application/csv').expect(200, body)
                .then(() => request().get('/api/countries').query({ limit: 3 })
                    .accept('text/comma-separated-values')
                    .expect(200, body))));

    it('get count in tsv', () =>
        request().get('/api/countries')
            .query({ count: true })
            .accept('text/tsv')
            .expect(200, '250\n'))

    it('get array in tsv', () =>
        request().get('/api/countries?select=_id name')
            .query({ limit: 3, sort: '_id' })
            .accept('text/tsv')
            .expect(200, '_id\n680\n_id\tname\nABW\tAruba\nAFG\tAfghanistan\n'))

    it('get object in tsv', () =>
        request().get('/api/countries/TWN?select=_id name')
            .accept('text/tsv')
            .expect(200, '_id\tname\nTWN\tTaiwan\n'))

    it('get distinct values in tsv', () =>
        request().get('/api/countries')
            .query({ distinct: 'continent', sort: 'continent' })
            .accept('text/tsv')
            .expect(200, 'AF\nAN\nAS\nEU\nNA\nOC\nSA\n'))

    it('get application/tsv equals text/tsv equals text/tab-separated-values', () =>
        request().get('/api/countries').query({ limit: 3 })
            .accept('text/tsv').expect(200)
            .then(({ body }) => request().get('/api/countries').query({ limit: 3 })
                .accept('application/tsv').expect(200, body)
                .then(() => request().get('/api/countries').query({ limit: 3 })
                    .accept('text/tab-separated-values')
                    .expect(200, body))));

    it('get count in yaml', () =>
        request().get('/api/countries')
            .query({ count: true })
            .accept('text/plain')
            .expect(200, "'250'\n"))

    it('get array in yaml', () =>
        request().get('/api/countries?select=_id name')
            .query({ limit: 3 })
            .accept('text/plain')
            .expect(200, '---\n- _id: TWN\n  name: Taiwan\n- _id: AFG\n  name: Afghanistan\n- _id: ALB\n  name: Albania\n'))

    it('get object in yaml', () =>
        request().get('/api/countries/TWN?select=_id name')
            .accept('text/plain')
            .expect(200, '- _id: TWN\n  name: Taiwan\n'))

    it('get distinct values in yaml', () =>
        request().get('/api/countries')
            .query({ distinct: 'continent' })
            .accept('text/plain')
            .expect(200, '---\n- AF\n- AN\n- AS\n- EU\n- NA\n- OC\n- SA\n'))

    it('get distinct values in js/jsonp', () =>
        request().get('/api/countries?callback=jsonp')
            .query({ distinct: 'continent' })
            .accept('application/jsonp')
            .expect(200, 'jsonp(["AF","AN","AS","EU","NA","OC","SA"])'))

    it('get json array in js/jsonp', () =>
        request().get('/api/countries?callback=jsonp&select=_id name')
            .query({ limit: 3 })
            .accept('application/javascript')
            .expect(200, 'jsonp([{"_id":"TWN","name":"Taiwan"},{"_id":"AFG","name":"Afghanistan"},{"_id":"ALB","name":"Albania"}])'))

    it('get json object in js/jsonp', () =>
        request().get('/api/countries/TWN?callback=jsonp&select=_id name')
            .accept('application/javascript')
            .expect(200, 'jsonp([{"_id":"TWN","name":"Taiwan"}])'))

    xit('get distinct values in msgpack/octet-stream', () =>
        request().get('/api/countries')
            .query({ distinct: 'continent' })
            .accept('application/octet-stream')
            .expect('Content-Type', /octet-stream/)
            .expect(200)
            .then(({ body }) => expect(msgpack.decode(body)).toEqual(['AS', 'EU', 'AF', 'OC', 'NA', 'AN', 'SA'])))

    xit('get json array in msgpack/octet-stream', () =>
        request().get('/api/countries?select=_id name')
            .query({ limit: 3, sort: '$natural' })
            .accept('application/octet-stream')
            .expect('Content-Type', /octet-stream/)
            .expect(200)
            .then(({ body }) => expect(msgpack.decode(body)).toEqual([
                { "_id": "TWN", "name": "Taiwan" },
                { "_id": "AFG", "name": "Afghanistan" },
                { "_id": "ALB", "name": "Albania" }])))

    xit('get json object in msgpack/octet-stream', () =>
        request().get('/api/countries/TWN?select=_id name')
            .accept('application/octet-stream')
            .expect('Content-Type', /octet-stream/)
            .expect(200)
            .then(({ body }) => expect(msgpack.decode(body)).toEqual({ "_id": "TWN", "name": "Taiwan" })))

});