const BookmarkService= {
  getAllBookmarks(knex) {
    return knex
      .select('*')
      .from('bookmark_list');
  },
  insertBookmark(knex, newBookmark){
    return knex
      .insert(newBookmark)
      .into('bookmark_list')
      .returning('*')
      .then(rows=> {
        return rows[0];
      });
  },
  getById(knex, id){
    return knex
      .from('bookmark_list')
      .select('*')
      .where('id', id)
      .first();
  },
  deleteBookmark(knex, id){
    return knex('bookmark_list')
      .where({id})
      .delete();
  },
  updateBookmark(knex, id, newBookmarkFields){
    return knex('bookmark_list')
      .where({id})
      .update(newBookmarkFields);
  }
};

module.exports = BookmarkService;