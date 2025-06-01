import { openDB } from 'idb';

const DATABASE_NAME = 'storyapps';
const DATABASE_VERSION = 1;
const OBJECT_STORE_NAME = 'saved-story';

const dbPromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(OBJECT_STORE_NAME)) {
      db.createObjectStore(OBJECT_STORE_NAME, { keyPath: 'id' });
    }
  },
});

const Database = {
  async putStory(story) {
    if (!Object.hasOwn(story, 'id')) {
      throw new Error('`id` is required to save.');
    }
    return (await dbPromise).put(OBJECT_STORE_NAME, story);
  },

  async getAllStory() {
    return (await dbPromise).getAll(OBJECT_STORE_NAME);
  },

  async getStoryById(id) {
    if (!id) {
      throw new Error('`id` is required.');
    }
    return (await dbPromise).get(OBJECT_STORE_NAME, id);
  },

  async removeStory(id) {
    return (await dbPromise).delete(OBJECT_STORE_NAME, id);
  },
};

export default Database;
