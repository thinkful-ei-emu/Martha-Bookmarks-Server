function makeBookmarkArray() {
  return[
    {
      'id': 1,
      'title': 'Goggle',
      'url': 'https://www.google.com',
      'rating':	3,
      'description':	'This is a greate website'
    },
    {
      'id': 2,
      'title': 'Yahoo',
      'url': 'https://www.yahoo.com',
      'rating':	2,
      'description':	'This is not a greate website'
    },
    {
      'id': 3,
      'title': 'Thinkful',
      'url':	'https://www.thinkful.com',
      'rating':	5,
      'description':	'This is helping me towards a new career'
    }
  ];
}

module.exports = {
  makeBookmarkArray,
};