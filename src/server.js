const app = require('./app');
const { PORT, NODE_ENV } = require('./config');

app.listen(PORT, () => {
  console.log(`Server is listening at http://localhost:${PORT} in ${NODE_ENV} mode...`);
});