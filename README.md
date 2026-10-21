# Anandkiran patient app

Expo / React Native app for **patients only**. A patient logs in with the registration number the clinic gives them and sees:

| Tab | What it shows |
| --- | --- |
| होम / Home | Greeting, access validity, next clinic session, today's exercises and music, ongoing therapies, recent activity, call / WhatsApp the clinic |
| मेरी थेरेपी / My therapy | Therapies assigned by the therapist (schedule, therapist, dates, progress, goals, notes, guide videos / PDFs) and exercises (video + steps + "Mark as done") |
| संगीत / Music | Music therapy tracks chosen for the patient, with a player |
| इतिहास / History | Full record by month: clinic sessions (attended / missed, therapist, notes), exercises done, music listened, tests, plan changes; filter by type |
| प्रोफ़ाइल / Profile | Details, access valid till, Hindi / English, clinic contact, online booking, log out |

Hindi is the default language; patients can switch to English (remembered on the phone). The look matches the Anandkiran website (same colours and logo). All text uses Poppins, which includes Hindi characters.

## Run

```bash
npm install
npx expo start --dev-client      # or: npm run android
```

Settings (create a `.env` file or set them in `eas.json` build profiles):

| Variable | Default | Purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | `http://localhost:8000/` | Backend base URL (same server as the admin panel). **Set this for every real build.** |
| `EXPO_PUBLIC_PATIENT_ACCESS_KEY` | current key | Sent with patient login (the backend currently requires it) |
| `EXPO_PUBLIC_INACTIVITY_LOGOUT_MINUTES` | `10080` (7 days) | Log the patient out after this long away from the app |

Clinic phone / WhatsApp / booking link: `src/config/env.js` → `CLINIC`.

## Code layout

```
App.js                      fonts, providers, navigator
src/navigation/RootNavigator.js   login screen when signed out; tabs + detail screens when signed in
src/screens/                Login, Home, Plan, TherapyDetail, ExerciseDetail, Music, History, Profile
src/api/patient.js          every backend call + data normalisers (one place to adjust field names)
src/context/AuthContext.js  session restore, login, logout, inactivity logout, 401 → logout
src/context/LanguageContext.js, src/i18n/strings.js   Hindi / English text
src/components/             shared UI (cards, buttons, badges, states), therapy + history items
src/theme.js                colours and fonts (same as the website)
```

## Patient app API

### Already used (no backend change needed)

| Endpoint | Notes |
| --- | --- |
| `POST /v1/auth/patient-login` | Body `{ phoneNumber: <registration number>, accessKey }` (unchanged). Returns `data: { token, fullName, role, phoneNumber, registrationNumber }`. Staff roles (`admin`, `super-admin`) are refused by the app. |
| `GET /v1/user/get-logged-in-user` | Profile. If it also returns `expiryDate`, the app shows access validity and an expiry warning. |
| `GET /v1/sounds/get-all-map-sounds` | Music for this patient. `soundId` may be one sound or a list; optional `purpose` / `description` are shown. |
| `GET /stream/:file?token=…&id=…` | Audio stream (unchanged), which is how listening activity reaches Patient Reports. |

### New, for the backend team

All require the patient's `Authorization: Bearer <token>` and return data only for that patient. Until an endpoint exists (404), the app shows "जल्द उपलब्ध / Coming soon" for that section and everything else keeps working. Text fields may be plain strings or `{ "hi": "…", "en": "…" }`.

**`GET /v1/patient/therapy-plan`**
```json
{ "data": {
  "therapies": [{
    "_id": "…", "name": "Physiotherapy", "type": "physiotherapy",
    "description": "…", "therapist": { "name": "Dr. …" },
    "schedule": { "days": ["Mon", "Wed", "Fri"], "time": "10:30", "frequency": "" },
    "startDate": "2026-09-01", "endDate": "2026-11-30",
    "status": "active | paused | completed",
    "sessionsCompleted": 14, "sessionsTotal": 24,
    "goals": ["…"], "notes": "…",
    "guides": [{ "title": "…", "type": "video | pdf", "url": "https://…" }]
  }],
  "nextSession": { "date": "2026-10-21T10:30:00", "time": "10:30", "therapy": "Physiotherapy", "therapist": "Dr. …" }
} }
```

**`GET /v1/patient/exercises`** → `{ data: { docs: [{ _id, title, description, steps: [], videoUrl, repetitions, frequency, therapy, doneToday, lastDoneAt }] } }`

**`POST /v1/patient/exercises/:id/done`** → records completion (visible to the therapist); return 200.

**`GET /v1/patient/history?page=1&limit=20&type=session|exercise|music|test|plan`** (newest first)
```json
{ "data": { "docs": [{
  "_id": "…", "type": "session", "date": "2026-10-17T10:30:00",
  "title": "…", "therapy": "Physiotherapy session", "therapist": "Dr. …",
  "status": "attended | missed | cancelled", "durationMinutes": 45, "notes": "…"
}], "page": 1, "totalPages": 3 } }
```

## Notes

- **Access key:** the patient-login `accessKey` ships inside the app, so anyone can extract it; it is not a security control. Patients currently log in with the registration number alone. A per-patient password or mobile OTP (as on the website's patient login) would be safer.
- **Signing keys:** `*.jks` keystores and `credentials.json` sit in the project folder. `.gitignore` already excludes them from git; also keep them out of zips you share, and back them up safely (losing the upload key blocks Play Store updates).
- **App name and icon:** `app.json` still says `arogyapath` with the existing icon, so the store listing is unchanged. Update `name`, `icon` and `splash` there if the store listing should become Anandkiran.
# anandkiran-reactnative
