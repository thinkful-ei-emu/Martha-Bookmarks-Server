const path = require('path');
const express = require('express');
const xss = require('xss');

const BookmarkService = require('../bookmark-server');

const bookmarkRouter = express.Router();
const jsonParser = express.json();

const serializeBookmark = bookmark => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  url: bookmark.url,
  description: xss(bookmark.description),
  rating: Number(bookmark.rating),
})

bookmarkRouter 
  .route('/')
  .get((req, res, next) => {
    BookmarkService.getAllBookmarks(
      req.app.get('db')
    )
      .then(bookmarks => {
        res.json(bookmarks.map(serializeBookmark));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { title, url, rating, description } = req.body;
    const newBookmark = { title, url, rating, description };   
    
    if(newBookmark.rating > 5  || newBookmark.rating<1){
      return res.status(400).json({error: {message: 'Rating must be an integer between 1 and 5'}});
    }
    
    const requiredFields = [ 'title', 'url', 'rating', 'description'];
    for(const field of requiredFields){
      if(!req.body[field]){
        return res.status(400).json({error:{ message: `Missing '${field}' in request body`}});
      }
    }

    BookmarkService.insertBookmark(req.app.get('db'), newBookmark)
      .then(bookmark => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${bookmark.id}`))
          .json(bookmark);
      })
      .catch(next);
  });

bookmarkRouter
  .route('/:bookmark_id')
  .all((req, res, next) => {
    BookmarkService.getById(
      req.app.get('db'),
      req.params.bookmark_id
    )
      .then(bookmark => {
        if(!bookmark) {
          return res.status(404).json({
            error: { message: 'Bookmark does not exist'}
          });
        }
        res.bookmark = bookmark; //saves the bookmark for the next middleware
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    BookmarkService.getById(req.app.get('db'), req.params.bookmark_id)
      .then(bookmark => {
        if(!bookmark){
          return res.status(404).json({
            // eslint-disable-next-line quotes
            error: { message: 'Bookmark does not exist'}
          });
        }
        res.json({
          id: bookmark.id,
          title: xss(bookmark.title), //sanitzie title
          url: xss(bookmark.url), //sanitize url
          rating: bookmark.rating,
          description: xss(bookmark.description) //sanitzie description
        });
      })
      .catch(next);
  })
  .delete((req, res, next) => {
    BookmarkService.deleteBookmark(
      req.app.get('db'), req.params.bookmark_id
    )
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const { title, url, rating, description } = req.body;
    const bookmarkToUpdate = { title, url, rating, description };
    
    const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length;
    if(numberOfValues === 0){
      return res.status(400).json({
        error: {message: 'Request body must contain either "title", "url", "rating" or "description"'}
      });
    }
    
    
    BookmarkService.updateBookmark(
      req.app.get('db'), 
      req.params.bookmark_id, 
      bookmarkToUpdate
    )
      .then(rowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = bookmarkRouter;

// bookmarkRouter
//   .route('/bookmarks')
//   .get((req, res, next) => {
//     BookmarkService.getAllBookmarks(req.app.get('db'))
//       .then(bookmarks => {
//         res.json(bookmarks);
//       })
//       .catch(next);
//   })
//   .post(jsonParser, (req, res)=> {
//     const { title, url, rating, desc } = req.body;

//     if(!title) {
//       logger.error('Title is required');
//       return res.status(400).send('Invalid Title');
//     }
//     if(!url) {
//       logger.error('URL is required');
//       return res.status(400).send('Invalid URL');
//     }
//     if(!rating) {
//       logger.error('Rating is required');
//       return res.status(400).send('Invalid Rating');
//     }
//     if(!desc) {
//       logger.error('Description is required');
//       return res.status(400).send('Invalid Description');
//     }

//     const id = uuid();

//     const bookmark = {
//       id, 
//       title, 
//       url, 
//       rating, 
//       desc
//     };

//     bookmarks.push(bookmark);

//     logger.info(`Bookmark with id ${id} was created.`);

//     res.status(201).location(`http://localhost:8000/card/${id}`).json(bookmark);
//   });

// bookmarkRouter
//   .route('/bookmarks/:id')
//   .get((req, res) => {
//     const { id } = req.params;
//     const bookmark = bookmarks.find(b => b.id === id);

//     if(!bookmark) {
//       logger.error(`Bookmark with id ${id} not found.`);
//       return res.status(404).send('Bookmark not found.');
//     }
//     res.json(bookmark);
//   })
//   .delete((req, res) => {
//     const { id } = req.params;
//     const bookmarkIndex = bookmarks.findIndex(b => b.id === id);

//     if(bookmarkIndex === -1) {
//       logger.error(`Bookmark with id ${id} not found`);
//       return res.status(404).send('Bookmark not found');
//     }

//     bookmarks.splice(bookmarkIndex, 1);

//     logger.info(`Bookmark with id ${id} was deleted`);
//     res.status(204).end();
//   });

