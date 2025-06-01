import { getAccessToken } from '../utils/auth';
import { BASE_URL } from '../config';

const ENDPOINTS = {
  REGISTER: `${BASE_URL}/register`,
  LOGIN: `${BASE_URL}/login`,
  STORIES: `${BASE_URL}/stories`,
  STORIES_GUEST: `${BASE_URL}/stories/guest`,
  STORY_DETAIL: (id) => `${BASE_URL}/stories/${id}`,
  COMMENTS: (storyId) => `${BASE_URL}/stories/${storyId}/comments`,
  SUBSCRIBE: `${BASE_URL}/notifications/subscribe`,
  UNSUBSCRIBE: `${BASE_URL}/notifications/subscribe`,
};

export async function register({ name, email, password }) {
  const response = await fetch(ENDPOINTS.REGISTER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

  if (!response.ok) {
    throw new Error(`Gagal mendaftar: ${response.statusText}`);
  }

  const json = await response.json();
  return { ...json, ok: response.ok };
}

export async function login({ email, password }) {
  const response = await fetch(ENDPOINTS.LOGIN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Gagal masuk: ${response.statusText}`);
  }

  const json = await response.json();
  return { ...json, ok: response.ok };
}

export async function getAllStories({ page, size, location = 0 } = {}) {
  const accessToken = getAccessToken();
  const url = new URL(ENDPOINTS.STORIES);

  if (page) url.searchParams.append('page', page);
  if (size) url.searchParams.append('size', size);
  if (location) url.searchParams.append('location', location);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Gagal mengambil cerita: ${response.statusText}`);
  }

  const json = await response.json();
  return { ...json, ok: response.ok };
}

export async function getAllComments(storyId) {
  const response = await fetch(ENDPOINTS.COMMENTS(storyId));

  if (!response.ok) {
    throw new Error(`Gagal mengambil komentar: ${response.statusText}`);
  }

  const json = await response.json();
  return { ...json, ok: response.ok };
}

export async function createComment(storyId, data) {
  const accessToken = getAccessToken();

  const response = await fetch(ENDPOINTS.COMMENTS(storyId), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Gagal mengirim komentar: ${response.statusText}`);
  }

  const json = await response.json();
  return { ...json, ok: response.ok };
}

export async function getStoryById(id) {
  const accessToken = getAccessToken();

  const response = await fetch(ENDPOINTS.STORY_DETAIL(id), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Gagal mengambil detail cerita: ${response.statusText}`);
  }

  const json = await response.json();
  return { ...json, ok: response.ok };
}

export async function createStory({ description, photo, lat, lon }) {
  const accessToken = getAccessToken();

  const formData = new FormData();
  formData.append('description', description);
  formData.append('photo', photo);
  if (lat !== undefined) formData.append('lat', lat);
  if (lon !== undefined) formData.append('lon', lon);

  const response = await fetch(ENDPOINTS.STORIES, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });

  if (!response.ok) {
    const responseData = await response.json();
    console.error('Error Response Body:', responseData);
    throw new Error(`Gagal membuat cerita: ${responseData.message || response.statusText}`);
  }

  const json = await response.json();

  return {
    data: json,
    message: json.message || 'Berhasil membuat cerita',
  };
}

export async function createGuestStory({ description, photo, lat, lon }) {
  const formData = new FormData();
  formData.append('description', description);
  formData.append('photo', photo);
  if (lat !== undefined) formData.append('lat', lat);
  if (lon !== undefined) formData.append('lon', lon);

  const response = await fetch(ENDPOINTS.STORIES_GUEST, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Gagal membuat cerita tamu: ${response.statusText}`);
  }

  const json = await response.json();
  return { ...json, ok: response.ok };
}

export async function subscribePushNotification({ endpoint, keys: { p256dh, auth } }) {
  const accessToken = getAccessToken();

  const response = await fetch(ENDPOINTS.SUBSCRIBE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ endpoint, keys: { p256dh, auth } }),
  });

  if (!response.ok) {
    throw new Error(`Gagal berlangganan notifikasi: ${response.statusText}`);
  }

  const json = await response.json();
  return { ...json, ok: response.ok };
}

export async function unsubscribePushNotification({ endpoint }) {
  const accessToken = getAccessToken();

  const response = await fetch(ENDPOINTS.UNSUBSCRIBE, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ endpoint }),
  });

  if (!response.ok) {
    throw new Error(`Gagal berhenti berlangganan notifikasi: ${response.statusText}`);
  }

  const json = await response.json();
  return { ...json, ok: response.ok };
}
