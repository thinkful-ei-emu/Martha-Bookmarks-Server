require('dotenv').config();
const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');
const { makeBookmarkArray } = require('./bookmark.fixtures');

describe.only('Bookmark Endpoints', () => {
  let db;
  before('make knex instance', () => {
    db= knex({
      client: 'pg',
      connection: process.env.DB_URL_TEST,
    });
    app.set('db', db);
  });
  after('disconnect from db', () => db.destroy());
  before('clean up', () => db('bookmark_list').truncate());
  afterEach('clean up', () => db('bookmark_list').truncate());

  describe('GET /bookmarks endpoints', () => {
    context('Given no bookmarks', ()=> {
      it('responds with 200 and an empty list', ()=> {
        return supertest(app)
          .get('/bookmarks')
          .set({'Authorization': `Bearer ${process.env.API_TOKEN}`})
          .expect(200, []);
      });
    });
    context('Given there are bookmarks', ()=> {
      const testBookmarks = makeBookmarkArray();
      beforeEach('insert bookmarks', ()=> {
        return db
          .into('bookmark_list')
          .insert(testBookmarks);
      });
      it('GET /bookmarks responds with 200 and all the bookmarks in a list', ()=> {
        return supertest(app)
          .get('/bookmarks')
          .set({'Authorization': `Bearer ${process.env.API_TOKEN}`})
          .expect(200, testBookmarks);
      });
    });
  });

  describe('GET /bookmarks/:bookmark_id endpoints', () => {
    context('Given no bookmarks', ()=> {
      it('GET /bookmarks/:bookmark_id responds with 404 and an error message', ()=> {
        return supertest(app)
          .get('/bookmarks/100')
          .set({'Authorization': `Bearer ${process.env.API_TOKEN}`})
          .expect(404, {error: {message: `Bookmark doesn't exist`} });
      });
    });

    context('Given bookmark exists', ()=> {
      const testBookmarks = makeBookmarkArray();
      beforeEach('insert bookmarks', ()=> {
        return db
          .into('bookmark_list')
          .insert(testBookmarks);
      });
      it('GET /bookmarks/:bookmark_id responds with a 200 and the specific bookmark', ()=> {
        const bookmarkId = 2;
        const expectedBookmark = testBookmarks[bookmarkId - 1];
        return supertest(app)
          .get(`/bookmarks/${bookmarkId}`)
          .set({'Authorization': `Bearer ${process.env.API_TOKEN}`})
          .expect(200, expectedBookmark);
      });
    });
  });
});