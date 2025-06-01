export default class HomePresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async showStorysListMap() {
    this.#view.showMapLoading();
    try {
      await this.#view.initialMap();
    } catch (error) {
      console.error('showStorysListMap: error:', error);
    } finally {
      this.#view.hideMapLoading();
    }
  }

  async initialGalleryAndMap() {
    this.#view.showLoading();
    try {
      await this.showStorysListMap();

      console.log('Fetching all stories...');
      const response = await this.#model.getAllStories();
      console.log('Response:', response);

      if (!response.ok) {
        console.error('initialGalleryAndMap: response:', response);
        this.#view.populateStorysListError(response.message);
        return;
      }

      this.#view.populateStorysList(response.message, response.listStory);
    } catch (error) {
      console.error('initialGalleryAndMap: error:', error);
      this.#view.populateStorysListError(error.message);
    } finally {
      this.#view.hideLoading();
    }
  }
}
