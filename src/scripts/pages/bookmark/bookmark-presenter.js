import { reportMapper, storyMapper } from '../../data/api-mapper';

export default class BookmarkPresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async initialGalleryAndMap() {
    this.#view.showStorysListLoading();

    try {
      const listOfStorys = await this.#model.getAllStory();
      const storys = await Promise.all(listOfStorys.map(storyMapper));

      const message = 'Berhasil mendapatkan daftar cerita tersimpan.';
      this.#view.populateBookmarkedStorys(message, storys);
    } catch (error) {
      console.error('initialGalleryAndMap: error:', error);
      this.#view.populateBookmarkedStorysError(error.message);
    } finally {
      this.#view.hideStorysListLoading();
    }
  }
}
