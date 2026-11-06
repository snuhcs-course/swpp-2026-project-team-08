<!-- AI-generated with GPT-6, 2026-11-06, reviewed by Haechan Jung -->
<!-- Changed: Iteration 3 demo setup, progress, verification, and video -->

# NurtureBites

NurtureBites is a meal tracker and planning app for caregivers of autistic children with sensory-selective eating. Caregivers record what was served and what happened after the meal, then get small, restriction-aware ideas for what to try next.

## Features

- **Caregiver accounts:** Sign up, log in, securely store access/refresh tokens, edit the caregiver name, log out, and delete the account.
- **Child profile onboarding:** Record consent, child basics, allergies, dietary restrictions, the family's dietary pattern, and Safe Foods with preparation notes. Resume saved onboarding progress and edit the child profile later.
- **Meal check-in:** Record the date, meal type, and place; manually add foods, ingredients, and cooking methods; optionally attach a camera, gallery, or file photo. Resume drafts that contain user input.
- **After-meal review:** Record food and selected ingredient outcomes, optional difficulty reasons, and an optional after-meal photo. Foods marked Eaten are excluded from difficulty questions and recommendation targets.
- **Home and Meal History:** Continue unfinished meals, find records by calendar or search, and open meal details with recorded outcomes and photos.
- **Personalized suggestions:** Generate food-level suggestions through LangGraph/OpenRouter, then save, dismiss, skip, or undo. Suggestions use recorded difficulties, Safe Foods, previously eaten foods, and the ingredient catalog filtered by the child's restrictions. Saved suggestions can be selected when recording a later meal.
- **My Page:** View and edit the child profile and caregiver account. We support only English in this version.

## Iteration 3 Progress

Iteration 3 focuses on making the meal-recording and recommendation flow more complete and usable on mobile devices. Major changes since `iteration-2-demo` are:

- **Simpler onboarding and clearer copy ([#24](https://github.com/snuhcs-course/swpp-2026-project-team-08/pull/24), [#27](https://github.com/snuhcs-course/swpp-2026-project-team-08/pull/27)):** Remove out-of-scope profile questions, introduce an explicit family dietary-pattern selection, improve Safe Food entry, and revise Korean instructions. The dietary-pattern answer is stored separately from the restrictions used for recommendation filtering.
- **Meal and review usability ([#24](https://github.com/snuhcs-course/swpp-2026-project-team-08/pull/24), [#28](https://github.com/snuhcs-course/swpp-2026-project-team-08/pull/28)):** Improve food/ingredient editing, photo-entry screens, outcome sliders, progress indicators, draft handling, and restoration of difficulty choices. Skip difficulty/recommendation steps when there are no eligible targets.
- **Consistent stored data and ingredient filtering ([#25](https://github.com/snuhcs-course/swpp-2026-project-team-08/pull/25)):** Restructure profiles, meals, ingredient outcomes, and food recommendations; update the client/API contract; replace the mock ingredient catalog with database-backed ingredients and restriction judgments.
- **More relevant suggestions ([#29](https://github.com/snuhcs-course/swpp-2026-project-team-08/pull/29)):** Pass ingredient-level outcomes and difficulties, Safe Foods, and previously eaten foods to the recommendation workflow. Generate suggestions for reviewed foods that were not marked Eaten and reuse existing cards when changing targets.
- **Android build and screen fixes ([#28](https://github.com/snuhcs-course/swpp-2026-project-team-08/pull/28)):** Fix APK build paths on macOS, clipped button labels, native date/selection controls, Meal History sheet interactions, and onboarding state reset on logout. Platform build instructions are in [client/docs/deploy.md](client/docs/deploy.md).
- **Automated verification ([#19](https://github.com/snuhcs-course/swpp-2026-project-team-08/pull/19), [#26](https://github.com/snuhcs-course/swpp-2026-project-team-08/pull/26)):** Organize client/server unit and integration tests, add coverage reporting and client CI, and document test responsibilities and examples.

### Current demo limitations

- Email-change code generation and confirmation exist, but delivery by email is not connected.
- My Page's tutorial/help and full privacy-policy entries.
- Native photo files remain on the device; this demo does not provide cross-device photo-file synchronization.

## Demo Video

[Watch the Iteration 3 demo](iteration3_demo.mp4)

## Setup and Execution

The repository has a FastAPI backend in `server/` and an Expo / React Native app in `client/`. Start the server first, then the app. Commands below are for a fresh local demo database and a bash/zsh terminal.

### Prerequisites
- Git
- Node.js matching `client/package.json`: 22.13+ on 22.x, 24.3+ on 24.x, or 26+; npm
- Python 3.12 or later and `uv`
- Docker with Docker Compose for local PostgreSQL
- An Expo Go client compatible with Expo SDK 58, or a local native build with Android Studio/JDK/Android SDK (Android) or macOS/Xcode/CocoaPods (iOS)
- An OpenRouter API key for the personalized-suggestion portion of the demo

### 1. Clone the demo branch

```bash
git clone --branch iteration-3-demo --single-branch https://github.com/snuhcs-course/swpp-2026-project-team-08.git
cd swpp-2026-project-team-08
```

### 2. Run the server

```bash
cd server
uv sync --frozen
# First setup only: preserve an existing .env.
if [ ! -f .env ]; then cp .env.example .env; fi
```

Edit the local `.env` and set `OPENROUTER_API_KEY` before trying suggestions. Keep the file private. The supplied local database defaults work with the Compose configuration; use a separate `JWT_SECRET_KEY` outside local development.

```bash
docker compose up -d --wait
uv run alembic upgrade head
uv run python scripts/load_ingredients.py --check
uv run python scripts/load_ingredients.py
uv run uvicorn app.main:app --reload --host 0.0.0.0
```

The migration and catalog import commands write to the database configured in `.env`; use the local demo database. The catalog import is required for a fresh database and loads 1,613 ingredients and 18,711 restriction judgments. The `--check` command only validates the bundled data.

- API docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health check: [http://localhost:8000/health](http://localhost:8000/health)
- The server can start without an OpenRouter key, but recommendation generation will fail.

### 3. Run the mobile app

In a second terminal, start from the repository root:

```bash
cd client
npm ci
```

Set the API address for your device. Replace the example LAN address with your computer's address; the phone and computer must be able to reach each other.

| Runtime | Example `EXPO_PUBLIC_API_URL` |
|---|---|
| Physical phone on the same network | `http://192.168.0.10:8000` |
| Android Studio emulator | `http://10.0.2.2:8000` |
| iOS Simulator on the server's Mac | `http://localhost:8000` |

```bash
export EXPO_PUBLIC_API_URL=http://192.168.0.10:8000
npx expo start
```

Scan the QR code using an Expo SDK 58-compatible Expo Go client. If the installed Expo Go client cannot run this SDK or a required native module, stop Metro and build the app locally from `client/` after installing the relevant platform tools:

```bash
# Choose one platform; retain the API address set above.
npx expo run:android
# Or, on macOS:
npx expo run:ios
```

For an Android emulator, change the exported API address to `http://10.0.2.2:8000` before starting or building the app. For a standalone release APK or iOS build, follow [client/docs/deploy.md](client/docs/deploy.md).

The demo uses npm and the committed `client/package-lock.json`. The Bun installation example in `client/README.md` references a `bun.lock` that is not present in this snapshot; use the npm commands above for this branch.

## Development Environment

The following versions were observed on the machine used to prepare and run automated checks for this draft on November 6, 2026. Dependencies were reused from the existing local installation. A fresh installation, physical-device walkthrough, and live OpenRouter call have not been revalidated for this draft; the final recording device is still to be recorded.

| Item | Version / notes |
|---|---|
| OS | macOS 14.7.1, Apple silicon (`arm64`) |
| Node.js / npm | 26.0.0 / 12.0.2 |
| Python / uv | 3.12.3 / 0.11.17 |
| Docker CLI | 28.4.0 |
| Expo SDK | 58 (`expo` `~58.0.19` in `client/package.json`) |
| React Native / React | 0.88.0 / 19.3.0 |
| Backend | FastAPI + Uvicorn, port 8000 |
| Database target | PostgreSQL 16 (`postgres:16-alpine`); automated API tests use in-memory SQLite |
| Mobile runtime | Expo SDK 58-compatible client or local native build |

### Automated checks

The snapshot passed 344 client tests, client lint and TypeScript checks, 305 server tests, server lint/format checks, and ingredient-file validation. Tests use a fake LLM and do not verify live model responses.

| Area | Commands (run inside that directory) |
|---|---|
| `client/` | `npm run lint`, `npx tsc --noEmit`, `npm test` |
| `server/` | `uv run pytest`, `uv run ruff check .`, `uv run ruff format --check .` |
| Ingredient data (`server/`) | `uv run python scripts/load_ingredients.py --check` |

)
