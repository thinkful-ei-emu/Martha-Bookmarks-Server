require('dotenv').config();
const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');
const { makeBookmarkArray } = require('./bookmark.fixtures');

describe('Bookmark Endpoints', () => {
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
          .expect(404, {error: {message: 'Bookmark does not exist'} });
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

    context('Given an XSS attack article', ()=> {
      const maliciousArticle={
        id: 911,
        title: 'Naughty naughty very naughty <script>alert("xss");</script>',
        url: 'How-to',
        rating: 4,
        description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`
      };
      beforeEach('insert malicious article', ()=> {
        return db
          .into('bookmark_list')
          .insert([maliciousArticle]);
      });
      it('removes XSS attack content', ()=> {
        return supertest(app)
          .get(`/bookmarks/${maliciousArticle.id}`)
          .set({'Authorization': `Bearer ${process.env.API_TOKEN}`})
          .expect(200)
          .expect(res => {
            expect(res.body.title).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;');
            expect(res.body.description).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`);
          });
      });
    });
  });

  describe('POST /bookmarks endpoints', ()=> {
    context('bookmarks exists', ()=> {
      it('creates a bookmark respodning with 201 and the new bookmark', ()=> {
        const newBookmark = {
          title: 'Test bookmark',
          url: 'Test url',
          rating: 1,
          description: 'Test description'
        };
        return supertest(app)
          .post('/bookmarks')
          .set({'Authorization': `Bearer ${process.env.API_TOKEN}`})
          .send(newBookmark)
          .expect(201)
          .expect(res => {
            expect(res.body.title).to.eql(newBookmark.title);
            expect(res.body.url).to.eql(newBookmark.url);
            expect(res.body.rating).to.eql(newBookmark.rating);
            expect(res.body.description).to.eql(newBookmark.description);
            expect(res.body).to.have.property('id');
            expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`);
          })
          .then(postRes => 
            supertest(app)
              .get(`/bookmarks/${postRes.body.id}`)
              .set({'Authorization': `Bearer ${process.env.API_TOKEN}`})
              .expect(postRes.body)
          );
      });
      const requiredFields = ['title', 'url', 'rating', 'description'];
      requiredFields.forEach(field => {
        const newBookmark = {
          title: 'Test bookmark',
          url: 'Test url',
          rating: 1,
          description: 'Test description'
        };
        it(`responds with 400 and an error message when the '${field}' is not provided`, ()=> {
          delete newBookmark[field];
          return supertest(app)
            .post('/bookmarks')
            .set({'Authorization': `Bearer ${process.env.API_TOKEN}`})
            .send(newBookmark)
            .expect(400, {
              error: { message: `Missing '${field}' in request body`}
            });
        });
        it('responds with a 400 and an error message when incorrect rating', ()=> {
          const newBookmark = {
            title: 'Test bookmark',
            url: 'Test url',
            rating: 6,
            description: 'Test description'
          };
          return supertest(app)
            .post('/bookmarks')
            .set({'Authorization': `Bearer ${process.env.API_TOKEN}`})
            .send(newBookmark)
            .expect(400, {
              error: {message: 'Rating must be an integer between 1 and 5'}
            });
        });
      });
    });
  });

  describe('DELETE /bookmark/bookmark_id', () => {
    context('Given bookmarks in the list', ()=> {
      const testBookmarks = makeBookmarkArray();
      beforeEach('insert bookmarks', ()=> {
        return db
          .into('bookmark_list')
          .insert(testBookmarks);
      });

      it('should respond with 204 and remove the bookmark', ()=> {
        const idToRemove = 2;
        const expectedBookmark = testBookmarks.filter(bookmark => bookmark.id !== idToRemove);
        return supertest(app)
          .delete(`/bookmarks/${idToRemove}`)
          .set({'Authorization': `Bearer ${process.env.API_TOKEN}`})
          .expect(204)
          .then(res=> {
            supertest(app)
              .get('/bookmarks')
              .expect(expectedBookmark);
          });
      });
    });

    context('When no bookmarks exist', ()=> {
      it('should respond with a 404', () => {
        const bookmarkId = 54321;
        return supertest(app)
          .delete(`/bookmarks/${bookmarkId}`)
          .set({'Authorization': `Bearer ${process.env.API_TOKEN}`})
          .expect(404, { error: { message: 'Bookmark does not exist'} });
      });
    });
  });
});