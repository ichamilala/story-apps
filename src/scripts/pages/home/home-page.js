import {
  generateLoaderAbsoluteTemplate,
  generateStoryItemTemplate,
  generateStorysListEmptyTemplate,
  generateStorysListErrorTemplate,
} from '../../templates';
import HomePresenter from './home-presenter';
import Map from '../../utils/map';
import * as CityCareAPI from '../../data/api';

export default class HomePage {
  #presenter = null;
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
        <h1 class="section-title">Daftar Story</h1>

        <div class="storys-list__container">
          <div id="storys-list"></div>
          <div id="storys-list-loading-container"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new HomePresenter({
      view: this,
      model: CityCareAPI,
    });

    await this.#presenter.initialGalleryAndMap();
  }

  populateStorysList(message, storys) {
    if (!storys || storys.length <= 0) {
      this.populateStorysListEmpty();
      return;
    }

    const html = storys.reduce((accumulator, story) => {
      if (
        this.#map &&
        story.lat !== undefined &&
        story.lon !== undefined &&
        story.lat !== null &&
        story.lon !== null
      ) {
        const coordinate = [story.lat, story.lon];
        const markerOptions = { alt: story.name };
        const popupOptions = { content: story.name };
        this.#map.addMarker(coordinate, markerOptions, popupOptions);
      } else {
        console.warn(`Invalid coordinates for story ID: ${story.id}`);
      }

      return accumulator.concat(
        generateStoryItemTemplate({
          id: story.id,
          title: story.name,
          description: story.description,
          photoUrl: story.photoUrl,
          lat: story.lat,
          lon: story.lon,
          storyerName: story.name,
          createdAt: story.createdAt,
        }),
      );
    }, '');

    document.getElementById('storys-list').innerHTML = `
      <div class="storys-list">${html}</div>
    `;
  }

  populateStorysListEmpty() {
    document.getElementById('storys-list').innerHTML = generateStorysListEmptyTemplate();
  }

  populateStorysListError(message) {
    document.getElementById('storys-list').innerHTML = generateStorysListErrorTemplate(message);
  }

  async initialMap() {
    this.#map = await Map.build('#map', {
      zoom: 10,
      locate: true,
    });
  }

  showMapLoading() {
    document.getElementById('map-loading-container').innerHTML = generateLoaderAbsoluteTemplate();
  }

  hideMapLoading() {
    document.getElementById('map-loading-container').innerHTML = '';
  }

  showLoading() {
    document.getElementById('storys-list-loading-container').innerHTML =
      generateLoaderAbsoluteTemplate();
  }

  hideLoading() {
    document.getElementById('storys-list-loading-container').innerHTML = '';
  }
}
