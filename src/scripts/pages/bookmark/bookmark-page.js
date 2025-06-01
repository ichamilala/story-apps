import {
  generateLoaderAbsoluteTemplate,
  generateStoryItemTemplate,
  generateStorysListEmptyTemplate,
  generateStorysListErrorTemplate,
} from '../../templates';
import BookmarkPresenter from './bookmark-presenter.js';
import Database from '../../data/database.js';
import Map from '../../utils/map';

export default class BookmarkPage {
  #map = null;

  async render() {
    return `
      <section>
        <div class="storys-list__map__container">
          <div id="map" class="storys-list__map"></div>
          <div id="map-loading-container"></div>
        </div>
      </section>
 
      <section class="container">
        <h1 class="section-title">Daftar Cerita Story Tersimpan</h1>
 
        <div class="storys-list__container">
          <div id="storys-list"></div>
          <div id="storys-list-loading-container"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.presenter = new BookmarkPresenter({
      view: this,
      model: Database,
    });

    await this.presenter.initialGalleryAndMap();
    await this.initialMap();
  }

  async initialMap() {
    this.showMapLoading();
    this.#map = await Map.build('#map', {
      zoom: 10,
      locate: true,
    });
    this.hideMapLoading();
  }

  populateBookmarkedStorys(message, storys) {
    if (storys.length <= 0) {
      this.populateBookmarkedStorysListEmpty();
      return;
    }

    const html = storys.reduce((accumulator, story) => {
      return accumulator.concat(
        generateStoryItemTemplate({
          ...story,
          placeNameLocation: story.location?.placeName || 'Lokasi tidak diketahui',
          storyerName: story.storyer?.name || story.name || 'Anonim',
          isSaved: story.isSaved || true,
        }),
      );
    }, '');

    document.getElementById('storys-list').innerHTML = `
      <div class="storys-list">${html}</div>
    `;

    this.attachToggleSaveEventListeners();
  }

  attachToggleSaveEventListeners() {
    const toggleButtons = document.querySelectorAll('.story-item__toggle-save');
    toggleButtons.forEach((button) => {
      button.addEventListener('click', async (event) => {
        const id = event.target.getAttribute('data-id');
        const story = await Database.getStoryById(id);

        if (story.isSaved) {
          await Database.deleteStory(id);
          event.target.textContent = 'Simpan Cerita';
          story.isSaved = false;
          alert('Cerita berhasil dihapus.');
        } else {
          await Database.putStory({ ...story, isSaved: true });
          event.target.textContent = 'Buang Cerita';
          story.isSaved = true;
          alert('Cerita berhasil disimpan.');
        }
      });
    });
  }

  populateBookmarkedStorysListEmpty() {
    document.getElementById('storys-list').innerHTML = generateStorysListEmptyTemplate();
  }

  populateBookmarkedStorysError(message) {
    document.getElementById('storys-list').innerHTML = generateStorysListErrorTemplate(message);
  }

  showStorysListLoading() {
    document.getElementById('storys-list-loading-container').innerHTML =
      generateLoaderAbsoluteTemplate();
  }

  hideStorysListLoading() {
    document.getElementById('storys-list-loading-container').innerHTML = '';
  }

  showMapLoading() {
    document.getElementById('map-loading-container').innerHTML = generateLoaderAbsoluteTemplate();
  }

  hideMapLoading() {
    document.getElementById('map-loading-container').innerHTML = '';
  }
}
