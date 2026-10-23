<!-- AI-generated with Cursor Grok 4.6, 2026-10-23, reviewed by moonmoonboop -->

# SNU-SWPP-Template

You can use the README file to showcase and promote your mobile app. The template provided below is just a starting point. Feel free to craft your README as you see fit. 

Please note that the README doesn't affect your grade and is not included in documentation(Wiki).

# NurtureBites

NurtureBites is a meal tracker and planning app for caregivers of autistic children with sensory-selective eating. Caregivers record what was served and what happened after the meal, then get small, restriction-aware ideas for what to try next.

## Features

- **Caregiver accounts:** Sign up, log in, and keep access/refresh tokens in Expo SecureStore.
- **Child profile onboarding:** Consent, child basics, allergies, dietary restrictions, family food groups, dietary approaches, sensory profile, familiarity with new foods, and Safe Foods. Progress auto-saves.
- **Meal check-in:** Log date, meal type, and place; optionally add a before-meal photo; enter served foods, ingredients, and preparation by hand. Unfinished drafts can be resumed.
- **After-meal review:** Record each food as Eaten, Tasted, Untouched, or Unclear; optionally track ingredient outcomes and difficulty reasons; optionally add an after-meal photo.
- **Home (Today):** Start a new meal, continue a draft, and pick up meals that still need an after-meal review.
- **Meal History:** Calendar, search, and meal details with before/after photos, food responses, and linked suggestions.
- **Personalized suggestions:** After a review, generate meal ideas with a LangGraph/OpenRouter workflow, then save, dismiss, skip, or undo. Saved ideas can be linked to a meal and marked as tried.
- **My Page:** Caregiver account (name, email, delete account) and child profile editing.
- **Korean and English** UI copy.

## Iteration 2 Progress

Iteration 2 moved NurtureBites from a local prototype to a client–server app aligned with the newly edited version of Figma and product requirement document. A lot of medical research has been done to change the guideline of "what made the child not eat this food" to fulfill the autistic caregiver's needs. Out of the 3 AI implementation ideas, 2 of them were dropped (with TA's confirmation). Merged work on [the team repository](https://github.com/snuhcs-course/swpp-2026-project-team-08):

- **Backend foundation ([#5](https://github.com/snuhcs-course/swpp-2026-project-team-08/pull/5), [#6](https://github.com/snuhcs-course/swpp-2026-project-team-08/pull/6)):** FastAPI + Postgres, auth, meal APIs, and meal history/details screens.
- **CI/CD ([#8](https://github.com/snuhcs-course/swpp-2026-project-team-08/pull/8)):** GitHub Actions lint/test, Docker image build, and deploy to AWS (ECR, EC2, CloudFront).
- **Core product flows ([#7](https://github.com/snuhcs-course/swpp-2026-project-team-08/pull/7), [#9](https://github.com/snuhcs-course/swpp-2026-project-team-08/pull/9), [#13](https://github.com/snuhcs-course/swpp-2026-project-team-08/pull/13), [#14](https://github.com/snuhcs-course/swpp-2026-project-team-08/pull/14)):** Suggestion cards and saved-trial workflows; Meal History restyle; My Page and child profile; onboarding, meal check-in, after-meal review, and Home synced to the final ABC Figma (manual food entry; photos are optional references, not AI analysis).
- **LLM suggestions ([#16](https://github.com/snuhcs-course/swpp-2026-project-team-08/pull/16)):** LangGraph suggestion workflow, ingredient catalog, and OpenRouter model wiring.
- **Client–server contract ([#17](https://github.com/snuhcs-course/swpp-2026-project-team-08/pull/17)):** Shared models, DTOs, and DB schema so the app and API use the same meal, profile, and suggestion shapes.

### Known demo bugs 
(the bugs listed below will be fixed for iteration 3)
- After you take the before meal picture, when you try to 'review food item' by adding food, when trying to type the food's ingredient name, the add button might not work

###small things to implement for iteration 3(that has not been implemented yet) 
- sending emails for the verification code (if one wants to change the caregiver's email in the profile)
- uploading photos from gallery / file (only can take photos for now in the demo)
- profile's tutorial guide
- the login screen design is not aesthetically appealing so the design will be modified 
- profile's data policy and privacy guideline

## Setup and Execution

This repository has two parts: a FastAPI backend in `server/` and an Expo / React Native app in `client/`. Start the server first, then the app.

### Prerequisites

- Git
- [uv](https://docs.astral.sh/uv/getting-started/installation/) (Python package manager; do not use `pip`)
- Python 3.12 or later (`uv` can install it)
- Docker (local PostgreSQL)
- Node.js and npm
- [Expo Go](https://expo.dev/go) on a phone, or an iOS Simulator / Android emulator

### 1. Clone the repository

```bash
git clone https://github.com/snuhcs-course/swpp-2026-project-team-08.git
cd swpp-2026-project-team-08
```

### 2. Run the server

```bash
cd server
uv sync                                  # install dependencies (.venv is created automatically)
cp .env.example .env                     # local defaults are fine; replace JWT_SECRET_KEY outside local
docker compose up -d                     # start local Postgres
uv run alembic upgrade head              # apply database migrations
uv run uvicorn app.main:app --reload     # API at http://localhost:8000
```

- Interactive API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health
- Meal suggestions call an LLM. The server still starts if `OPENROUTER_API_KEY` in `.env` is empty, but suggestion generation will fail until you set a key.

Useful server commands (from `server/`):

| Task | Command |
|---|---|
| Tests (in-memory SQLite; Postgres not required) | `uv run pytest` |
| Lint / format | `uv run ruff check .` / `uv run ruff format .` |

More detail is in [`server/README.md`](server/README.md).

### 3. Run the mobile app

In a second terminal:

```bash
cd client
npm install
npx expo start
```

Then:

- Scan the QR code with Expo Go, or
- Press `i` for iOS Simulator / `a` for Android emulator / `w` for web

The app talks to `http://<dev-machine>:8000` by default (Metro’s host on a physical device, otherwise `localhost`). To point at another API, set `EXPO_PUBLIC_API_URL` before `npx expo start`.

Useful client commands (from `client/`):

| Task | Command |
|---|---|
| Lint | `npm run lint` |
| Typecheck | `npx tsc --noEmit` |
| Tests | `npm test` |

<!-- AI-generated with Cursor Grok 4.6, 2026-10-23, reviewed by moonmoonboop -->
## Development Environment

Local development and execution used the following environment.

| Item | Version / notes |
|---|---|
| OS | macOS 26.5.1 (Apple silicon) |
| Node.js | 26.0.0 |
| npm | 11.12.1 |
| Expo SDK | 57 (`expo` `~57.0.27`) |
| React Native | 0.86.3 |
| React | 19.2.3 |
| Client package manager | npm (`client/package-lock.json`) |
| Python | 3.14.7 via `uv` (project requires `>=3.12`; production image is `python:3.12-slim`) |
| uv | 0.13.1 |
| Backend | FastAPI + Uvicorn on port 8000 |
| Database | PostgreSQL 16 (`postgres:16-alpine` via Docker Compose) |
| Mobile runtime | Expo Go / `npx expo start` |

<!-- AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim -->
## Docs

- [Food ingredient · restriction ids](docs/food-ingredient-restriction-ids.md): 클라이언트와 서버가 공유하는 알러지 · 식이 제한 id
