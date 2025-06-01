import NewPresenter from './new-presenter';
import Camera from '../../utils/camera';
import { convertBase64ToBlob } from '../../utils';
import * as CityCareAPI from '../../data/api';
import { generateLoaderAbsoluteTemplate } from '../../templates';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default class NewPage {
  #presenter;
  #form;
  #camera;
  #isCameraOpen = false;
  #takenDocumentations = [];
  #map;
  #marker;

  async render() {
    return `
      <section>
        <div class="new-story__header">
          <div class="container">
            <h1 class="new-story__header__title">Buat Cerita Baru</h1>
            <p class="new-story__header__description">
              Silakan lengkapi formulir di bawah untuk membuat cerita baru.<br>
              Pastikan cerita yang dibuat adalah valid.
            </p>
          </div>
        </div>
      </section>
  
      <section class="container">
        <div class="new-form__container">
          <form id="new-form" class="new-form">
            <div class="form-control">
              <label for="title-input" class="new-form__title__title">Judul Story</label>
              <div class="new-form__title__container">
                <input id="title-input" name="title" placeholder="Masukkan judul story" aria-describedby="title-input-more-info">
              </div>
              <div id="title-input-more-info">Pastikan judul story singkat namun menarik.</div>
            </div>

            <div class="form-control">
              <label for="description-input" class="new-form__description__title">Deskripsi</label>
              <div class="new-form__description__container">
                <textarea id="description-input" name="description" placeholder="Masukkan deskripsi story. Ceritakan kisahmu di sini."></textarea>
              </div>
            </div>

            <div class="form-control">
              <label for="documentations-input" class="new-form__documentations__title">Dokumentasi</label>
              <div id="documentations-more-info">Anda dapat menyertakan foto sebagai dokumentasi.</div>
              <div class="new-form__documentations__container">
                <div class="new-form__documentations__buttons">
                  <button id="documentations-input-button" class="btn btn-outline" type="button">Ambil Gambar</button>
                  <input id="documentations-input" name="documentations" type="file" accept="image/*" multiple hidden="hidden" aria-multiline="true" aria-describedby="documentations-more-info">
                  <button id="open-documentations-camera-button" class="btn btn-outline" type="button">Buka Kamera</button>
                </div>
                <div id="camera-container" class="new-form__camera__container">
                  <video id="camera-video" class="new-form__camera__video">Video stream not available.</video>
                  <canvas id="camera-canvas" class="new-form__camera__canvas"></canvas>
                  <div class="new-form__camera__tools">
                    <select id="camera-select"></select>
                    <div class="new-form__camera__tools_buttons">
                      <button id="camera-take-button" class="btn" type="button">Ambil Gambar</button>
                    </div>
                  </div>
                </div>
                <ul id="documentations-taken-list" class="new-form__documentations__outputs"></ul>
              </div>
            </div>

            <div class="form-control">
              <div class="new-form__location__title">Lokasi</div>
              <div class="new-form__location__container">
                <div class="new-form__location__map__container">
                  <div id="map" class="new-form__location__map"></div>
                  <div id="map-loading-container"></div>
                </div>
                <div class="new-form__location__lat-lng">
                  <input type="number" name="lat" step="any">
                  <input type="number" name="lon" step="any">
                </div>
              </div>
            </div>

            <div class="form-buttons">
              <span id="submit-button-container">
                <button class="btn" type="submit">Buat Cerita</button>
              </span>
              <a class="btn btn-outline" href="#/">Batal</a>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new NewPresenter({
      view: this,
      model: CityCareAPI,
    });
    this.#takenDocumentations = [];

    this.#setupForm();
    this.#presenter.showNewFormMap();
    await this.initialMap();
  }

  #setupForm() {
    this.#form = document.getElementById('new-form');
    this.#form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const description = this.#form.elements.namedItem('description')?.value;
      const lat = parseFloat(this.#form.elements.namedItem('lat')?.value || 0);
      const lon = parseFloat(this.#form.elements.namedItem('lon')?.value || 0);
      const blob = this.#takenDocumentations[0]?.blob;

      if (!description || !blob) {
        alert('Deskripsi dan foto wajib diisi!');
        return;
      }

      const photo = new File([blob], 'photo.png', { type: 'image/png' });
      const formData = new FormData();
      formData.append('description', description);
      formData.append('photo', photo);
      if (!isNaN(lat)) formData.append('lat', lat);
      if (!isNaN(lon)) formData.append('lon', lon);

      await this.#presenter.postNewStory({ description, photo, lat, lon });
    });

    document.getElementById('documentations-input').addEventListener('change', async (event) => {
      const insertingPicturesPromises = Object.values(event.target.files).map(async (file) => {
        return await this.#addTakenPicture(file);
      });
      await Promise.all(insertingPicturesPromises);
      await this.#populateTakenPictures();
    });

    document.getElementById('documentations-input-button').addEventListener('click', () => {
      this.#form.elements.namedItem('documentations-input').click();
    });

    const cameraContainer = document.getElementById('camera-container');
    document
      .getElementById('open-documentations-camera-button')
      .addEventListener('click', async (event) => {
        cameraContainer.classList.toggle('open');
        this.#isCameraOpen = cameraContainer.classList.contains('open');

        if (this.#isCameraOpen) {
          event.currentTarget.textContent = 'Tutup Kamera';
          this.#setupCamera();
          await this.#camera.launch();
        } else {
          event.currentTarget.textContent = 'Buka Kamera';
          this.#camera.stop();
        }
      });
  }

  async initialMap() {
    if (this.#map) {
      this.#map.remove();
      this.#map = null;
    }

    const mapElement = document.getElementById('map');
    if (mapElement) {
      this.#map = L.map(mapElement).setView([-7.7956, 110.3695], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
      }).addTo(this.#map);

      this.#map.on('click', (event) => {
        const lat = event.latlng.lat;
        const lng = event.latlng.lng;

        this.#form.elements.namedItem('lat').value = lat;
        this.#form.elements.namedItem('lon').value = lng;

        if (this.#marker) {
          this.#map.removeLayer(this.#marker);
        }

        this.#marker = L.marker([lat, lng], {
          icon: new L.Icon.Default(),
        })
          .addTo(this.#map)
          .bindPopup('Lokasi Cerita');
      });
    }
  }

  #setupCamera() {
    if (!this.#camera) {
      this.#camera = new Camera({
        video: document.getElementById('camera-video'),
        cameraSelect: document.getElementById('camera-select'),
        canvas: document.getElementById('camera-canvas'),
      });
    }

    this.#camera.addCheeseButtonListener('#camera-take-button', async () => {
      const image = await this.#camera.takePicture();
      await this.#addTakenPicture(image);
      await this.#populateTakenPictures();
    });
  }

  async #addTakenPicture(image) {
    let blob = image;

    if (image instanceof String) {
      blob = await convertBase64ToBlob(image, 'image/png');
    }

    const newDocumentation = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      blob: blob,
    };
    this.#takenDocumentations = [...this.#takenDocumentations, newDocumentation];
  }

  async #populateTakenPictures() {
    const html = this.#takenDocumentations.reduce((accumulator, picture, currentIndex) => {
      const imageUrl = URL.createObjectURL(picture.blob);
      return accumulator.concat(`
        <li class="new-form__documentations__outputs-item">
          <button type="button" data-deletepictureid="${picture.id}" class="new-form__documentations__outputs-item__delete-btn">
            <img src="${imageUrl}" alt="Dokumentasi ke-${currentIndex + 1}">
          </button>
        </li>
      `);
    }, '');

    document.getElementById('documentations-taken-list').innerHTML = html;

    document.querySelectorAll('button[data-deletepictureid]').forEach((button) =>
      button.addEventListener('click', (event) => {
        const pictureId = event.currentTarget.dataset.deletepictureid;

        const deleted = this.#removePicture(pictureId);
        if (!deleted) {
          console.log(`Picture with id ${pictureId} was not found`);
        }

        this.#populateTakenPictures();
      }),
    );
  }

  #removePicture(id) {
    const selectedPicture = this.#takenDocumentations.find((picture) => picture.id == id);
    if (!selectedPicture) return null;

    this.#takenDocumentations = this.#takenDocumentations.filter(
      (picture) => picture.id != selectedPicture.id,
    );
    return selectedPicture;
  }

  storeSuccessfully(message) {
    console.log(message);
    this.clearForm();
    location.hash = '/';
  }

  storeFailed(message) {
    alert(message);
  }

  clearForm() {
    this.#form.reset();
  }

  showMapLoading() {
    document.getElementById('map-loading-container').innerHTML = generateLoaderAbsoluteTemplate();
  }

  hideMapLoading() {
    document.getElementById('map-loading-container').innerHTML = '';
  }

  showSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn" type="submit" disabled>
        <i class="fas fa-spinner loader-button"></i> Buat Cerita
      </button>
    `;
  }

  hideSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn" type="submit">Buat Cerita</button>
    `;
  }
}
