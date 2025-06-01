import { storyMapper } from '../../data/api-mapper';
import * as StoryAPI from '../../data/api';
import Database from '../../data/database';

export default class StoryDetailPresenter {
  #storyId;
  #view;
  #apiModel;
  #dbModel;

  constructor(storyId, { view, apiModel, dbModel }) {
    this.#storyId = storyId;
    this.#view = view;
    this.#apiModel = apiModel;
    this.#dbModel = dbModel;
  }

  async showStoryDetailMap() {
    await this.#view.initialMap();
  }

  async getAllStories() {
    try {
      const data = await this.#apiModel.getAllStories({ page: 1, size: 10 });
      if (data.ok) {
        this.#view.populateStories(data.stories);
      } else {
        this.#view.populateStoriesError('Failed to fetch stories');
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
      this.#view.populateStoriesError('Failed to fetch stories');
    }
  }

  async showStoryDetail() {
    try {
      const storyData = await this.#apiModel.getStoryById(this.#storyId);
      if (storyData.ok) {
        this.#view.populateStoryDetailAndInitialMap('', storyData.story);
      } else {
        this.#view.populateStoryDetailError('Story not found');
      }
    } catch (error) {
      console.error('Error fetching story details:', error);
      this.#view.populateStoryDetailError('Failed to fetch story details');
    }
  }

  async postNewComment(data) {
    try {
      await this.#apiModel.createComment(this.#storyId, data);
      this.#view.postNewCommentSuccessfully('Comment added successfully!');
    } catch (error) {
      this.#view.postNewCommentFailed('Failed to add comment.');
      console.error(error);
    }
  }

  async getCommentsList() {
    try {
      const data = await this.#apiModel.getAllComments(this.#storyId);
      if (Array.isArray(data.comments)) {
        this.#view.populateComments(data.comments);
      } else {
        this.#view.populateComments([]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      this.#view.populateComments([]);
    }
  }

  async saveStory() {
    try {
      const response = await this.#apiModel.getStoryById(this.#storyId);

      const story = response?.data || response?.story || null;

      if (!story || !story.id) {
        throw new Error('Cerita tidak valid atau tidak memiliki ID.');
      }

      await this.#dbModel.putStory(story);
      this.#view.saveToBookmarkSuccessfully('Cerita berhasil disimpan.');
    } catch (error) {
      console.error('saveStory: error:', error);
      this.#view.saveToBookmarkFailed(error.message);
    }
  }

  async removeStory() {
    try {
      await this.#dbModel.removeStory(this.#storyId);
      this.#view.removeFromBookmarkSuccessfully('Success to remove from bookmark');
    } catch (error) {
      console.error('removeStory: error:', error);
      this.#view.removeFromBookmarkFailed(error.message);
    }
  }

  async showSaveButton() {
    if (await this.#isStorySaved()) {
      this.#view.renderRemoveButton();
      return;
    }
    this.#view.renderSaveButton();
  }
  async #isStorySaved() {
    return !!(await this.#dbModel.getStoryById(this.#storyId));
  }

  showRemoveButton() {
    this.#view.renderRemoveButton();
  }
}
