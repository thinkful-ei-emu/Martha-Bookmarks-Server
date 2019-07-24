require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');

const { NODE_ENV } = require('./config');
const logger = require('./logger');
//const bookmarkRouter = require('./Bookmarks/bookmarks.route');
const BookmarkService = require('./bookmark-server');

const app = express();

const morganOptions = (NODE_ENV === 'production')
  ? 'common' 
  : 'dev';

app.use(morgan(morganOptions));
app.use(helmet());
app.use(cors());

//Bearer Token Authorization
app.use(function validateBearerToken (req, res, next){
  const apiToken = process.env.API_TOKEN;
  const authToken = req.get('Authorization');

  if(!authToken ||  authToken.split(' ')[1] !== apiToken) {
    //log statement for client
    logger.error(`Unauthorized request to path: ${req.path}`);
    return res.status(401).json({ error: 'Unauthorized request'});
  }
  next();
});

app.get('/bookmarks', (req, res, next) => {
  BookmarkService.getAllBookmarks(req.app.get('db'))
    .then(bookmarks => {
      res.json(bookmarks);
    })
    .catch(next);
});

app.get('/bookmarks/:bookmark_id', (req, res, next) => {
  BookmarkService.getById(req.app.get('db'), req.params.bookmark_id)
    .then(bookmark => {
      if(!bookmark){
        return res.status(404).json({
          error: { message: `Bookmark doesn't exist`}
        });
      }
      res.json(bookmark);
    })
    .catch(next);
});

//ROUTES GO HERE
//app.use(bookmarkRouter);

app.use(function errorHandler(error, req, res, next) { //eslint-disable-line no-unused-vars
  let response;
  if(NODE_ENV === 'production'){
    response = { error: {message: 'server error'} };
  } else {
    console.error(error);
    response = { message: error.message, error };
  }
  res.status(500).json(response);
});

module.exports = app;
