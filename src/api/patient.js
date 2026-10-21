import { api, API_URL, getAuthToken } from '../config/axios';
import { PATIENT_ACCESS_KEY } from '../config/env';

/*
 * Patient API. Endpoints marked EXISTING are already used by the current app and backend.
 * Endpoints marked NEW must be added on the backend (see README "Patient app API"). Until then
 * they return 404 and the app shows a friendly "coming soon" message instead of an error.
 */

export class UnavailableError extends Error {
  constructor() {
    super('Feature not available yet');
    this.name = 'UnavailableError';
  }
}

const unwrap = (response) => response?.data?.data ?? response?.data ?? null;

const callNew = async (request) => {
  try {
    return unwrap(await request());
  } catch (error) {
    const status = error?.response?.status;
    if (status === 404 || status === 501) throw new UnavailableError();
    throw error;
  }
};

const id = (raw) => raw?._id || raw?.id || '';
const asArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);
const docsOf = (data) => (Array.isArray(data) ? data : asArray(data?.docs));

// ---------- EXISTING endpoints ----------

/** POST /v1/auth/patient-login — the backend expects the registration number as `phoneNumber`. */
export async function loginPatient(registrationNumber) {
  const response = await api.post('/auth/patient-login', {
    phoneNumber: registrationNumber,
    accessKey: PATIENT_ACCESS_KEY,
  });
  return unwrap(response);
}

/** GET /v1/user/get-logged-in-user */
export async function getProfile() {
  const data = unwrap(await api.get('/user/get-logged-in-user'));
  return normalizeProfile(data);
}

export const normalizeProfile = (raw) =>
  raw
    ? {
        id: id(raw),
        fullName: raw.fullName || '',
        role: raw.role || '',
        phoneNumber: raw.phoneNumber || '',
        registrationNumber: raw.registrationNumber || '',
        expiryDate: raw.expiryDate || null,
      }
    : null;

/** GET /v1/sounds/get-all-map-sounds — music tracks assigned to this patient. */
export async function getMusicTracks() {
  const docs = docsOf(unwrap(await api.get('/sounds/get-all-map-sounds')));
  // A mapping may hold one sound or several (the admin panel stores a list).
  return docs.flatMap((doc) =>
    asArray(doc.soundId).map((sound, index) => ({
      key: `${id(doc)}-${id(sound) || index}`,
      mapId: id(doc),
      title: sound?.title || sound?.soundUid || '',
      description: sound?.description || '',
      purpose: sound?.purpose || sound?.category || '',
      file: sound?.file || '',
    }))
  ).filter((track) => track.file);
}

/** Streaming URL. The backend records listening activity from `token` and `id`. */
export const streamUrl = (track) =>
  `${API_URL}stream/${track.file}?token=${encodeURIComponent(getAuthToken() || '')}&id=${encodeURIComponent(track.mapId)}`;

// ---------- NEW endpoints ----------

/** GET /v1/patient/therapy-plan → { therapies: [...], nextSession: {...} } */
export async function getTherapyPlan() {
  const data = await callNew(() => api.get('/patient/therapy-plan'));
  return {
    therapies: asArray(data?.therapies).map(normalizeTherapy),
    nextSession: data?.nextSession ? normalizeSession(data.nextSession) : null,
  };
}

export const normalizeTherapy = (raw) => ({
  id: id(raw),
  name: raw.name || raw.title || '',
  type: raw.type || raw.slug || '',
  description: raw.description || '',
  therapist: raw.therapist?.name || raw.therapist || '',
  days: asArray(raw.schedule?.days),
  time: raw.schedule?.time || '',
  frequency: raw.schedule?.frequency || '',
  startDate: raw.startDate || null,
  endDate: raw.endDate || null,
  status: raw.status || 'active',
  sessionsDone: Number(raw.sessionsCompleted ?? raw.sessionsDone ?? 0),
  sessionsTotal: Number(raw.sessionsTotal ?? 0),
  goals: asArray(raw.goals),
  notes: raw.notes || '',
  guides: asArray(raw.guides).map((guide) => ({
    title: guide.title || '',
    type: guide.type === 'pdf' ? 'pdf' : 'video',
    url: guide.url || '',
  })),
});

const normalizeSession = (raw) => ({
  date: raw.date || null,
  time: raw.time || '',
  therapy: raw.therapy?.name || raw.therapy || '',
  therapist: raw.therapist?.name || raw.therapist || '',
});

/** GET /v1/patient/exercises → { docs: [...] } (only exercises assigned to this patient) */
export async function getExercises() {
  const data = await callNew(() => api.get('/patient/exercises'));
  return docsOf(data).map(normalizeExercise);
}

export const normalizeExercise = (raw) => ({
  id: id(raw),
  title: raw.title || raw.name || '',
  description: raw.description || '',
  steps: asArray(raw.steps),
  videoUrl: raw.videoUrl || raw.video || '',
  repetitions: raw.repetitions || '',
  frequency: raw.frequency || '',
  therapy: raw.therapy?.name || raw.therapy || '',
  doneToday: Boolean(raw.doneToday),
  lastDoneAt: raw.lastDoneAt || null,
});

/** POST /v1/patient/exercises/:id/done */
export async function markExerciseDone(exerciseId) {
  return callNew(() => api.post(`/patient/exercises/${exerciseId}/done`));
}

/** GET /v1/patient/history?page=&limit=&type= → { docs, page, totalPages } (newest first) */
export async function getHistory({ page = 1, limit = 20, type } = {}) {
  // Built by hand: React Native's URLSearchParams is incomplete on some versions.
  let query = `page=${page}&limit=${limit}`;
  if (type && type !== 'all') query += `&type=${encodeURIComponent(type)}`;
  const data = await callNew(() => api.get(`/patient/history?${query}`));
  return {
    items: docsOf(data).map(normalizeHistoryItem),
    page: Number(data?.page || page),
    totalPages: Number(data?.totalPages || 1),
  };
}

const HISTORY_TYPES = ['session', 'exercise', 'music', 'test', 'plan'];

export const normalizeHistoryItem = (raw) => ({
  id: id(raw) || `${raw.type}-${raw.date}`,
  type: HISTORY_TYPES.includes(raw.type) ? raw.type : 'session',
  date: raw.date || raw.createdAt || null,
  title: raw.title || '',
  therapy: raw.therapy?.name || raw.therapy || '',
  therapist: raw.therapist?.name || raw.therapist || '',
  notes: raw.notes || '',
  durationMinutes: raw.durationMinutes || null,
  status: raw.status || '',
});
