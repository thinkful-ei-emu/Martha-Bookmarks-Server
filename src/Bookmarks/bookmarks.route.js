const express = require('express');
const uuid = require('uuid/v4');


const { bookmarks } = require('../store/store');
const logger = require('../logger');

const bookmarkRouter = express.Router();
const bodyParser = express.json();

bookmarkRouter 
  .route('/bookmarks')
  .get((req, res) => {
    res.json(bookmarks);
  })
  .post(bodyParser, (req, res)=> {
    const { title, url, rating, desc } = req.body;

    if(!title) {
      logger.error('Title is required');
      return res.status(400).send('Invalid Title');
    }
    if(!url) {
      logger.error('URL is required');
      return res.status(400).send('Invalid URL');
    }
    if(!rating) {
      logger.error('Rating is required');
      return res.status(400).send('Invalid Rating');
    }
    if(!desc) {
      logger.error('Description is required');
      return res.status(400).send('Invalid Description');
    }

    const id = uuid();

    const bookmark = {
      id, 
      title, 
      url, 
      rating, 
      desc
    };

    bookmarks.push(bookmark);

    logger.info(`Bookmark with id ${id} was created.`);

    res.status(201).location(`http://localhost:8000/card/${id}`).json(bookmark);
  });

bookmarkRouter
  .route('/bookmarks/:id')
  .get((req, res) => {
    const { id } = req.params;
    const bookmark = bookmarks.find(b => b.id === id);

    if(!bookmark) {
      logger.error(`Bookmark with id ${id} not found.`);
      return res.status(404).send('Bookmark not found.');
    }
    res.json(bookmark);
  })
  .delete((req, res) => {
    const { id } = req.params;
    const bookmarkIndex = bookmarks.findIndex(b => b.id === id);

    if(bookmarkIndex === -1) {
      logger.error(`Bookmark with id ${id} not found`);
      return res.status(404).send('Bookmark not found');
    }

    bookmarks.splice(bookmarkIndex, 1);

    logger.info(`Bookmark with id ${id} was deleted`);
    res.status(204).end();
  });

module.exports = bookmarkRouter;