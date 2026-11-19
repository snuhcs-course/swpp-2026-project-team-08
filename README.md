<!-- AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo -->
<!-- AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung -->
<!-- Changed: 삭제한 실제 서버 테스트 실행 안내 제거 -->
<!-- AI-generated with GPT-6, 2026-10-26, reviewed by Seoyeon Heo -->
<!-- AI-generated with Cursor Grok 4.6, 2026-10-23, reviewed by moonmoonboop -->
<!-- AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim -->
<!-- AI-generated with Grok 4.7, 2026-11-19, reviewed by Doyeon Kim -->
<!-- Changed: Iteration 4 demo setup and progress from 10–19 Nov -->

# NurtureBites

NurtureBites is a meal tracker and planning app for caregivers of autistic children with sensory-selective eating. Caregivers record what was served and what happened after the meal, then get small, restriction-aware ideas for what to try next.

## Features

- **Caregiver accounts:** Sign up, log in, securely store access/refresh tokens, edit the caregiver name, log out, and delete the account.
- **Child profile onboarding:** Record consent, child basics, allergies, dietary restrictions, the family's dietary pattern, and Safe Foods with preparation notes. Resume saved onboarding progress and edit the child profile later.
- **Meal check-in:** Record the date, meal type, and place; manually add foods, ingredients, and cooking methods; optionally attach a camera, gallery, or file photo. A previously saved suggestion can be linked to a food in the meal. Resume drafts that contain user input.
- **After-meal review:** Record food and selected ingredient outcomes, optional difficulty reasons, and an optional after-meal photo. Foods marked Eaten are excluded from difficulty questions and recommendation targets.
- **Home and Meal History:** Continue unfinished meals, find records by calendar or search, and open meal details with recorded outcomes and photos.
- **Personalized suggestions:** Generate one small next step per reviewed food through LangGraph/OpenRouter. Save, dismiss, or undo. After the first dismissal, ask for one new suggestion with **Regenerate**, or continue without one. Suggestions use recorded difficulties, Safe Foods, previously eaten foods, and the ingredient catalog filtered by the child's restrictions.
- **My Page:** View and edit the child profile and caregiver account, and open the privacy policy. The demo UI is English. The unfinished tutorial entry stays disabled.

## Iteration 4 Progress

Iteration 4 is the work merged from 10 November through 19 November 2026, after `iteration-3-demo`. The visible changes follow heuristic-evaluation feedback: the suggestion step should offer another idea on purpose, and meal photos should be large enough that the saved record does not feel cramped.

- **Regenerate suggestion ([#31](https://github.com/snuhcs-course/swpp-2026-project-team-08/pull/31), [#35](https://github.com/snuhcs-course/swpp-2026-project-team-08/pull/35)):** Dismissing the first suggestion for a food shows the food name, the selected reasons, and a **Regenerate** button next to **Continue**. Regenerate asks for one different small change and includes the rejected card and reasons. The server allows that extra generation once per food and returns the saved card if it is requested again. **Skip** is no longer on the recommendation card. Cooking methods are shown with readable labels.
- **Larger meal photos ([#36](https://github.com/snuhcs-course/swpp-2026-project-team-08/pull/36)):** The check-in and after-meal save screens use a wider photo on the saved-meal card (about 148px tall, or 112px when before and after sit side by side), with a before/after label, the meal summary, and a short saved-versus-next step path. The previous thumbnails were about 95×79px, or 52×48px in the compact state.
- **Saved suggestion linked from check-in ([#34](https://github.com/snuhcs-course/swpp-2026-project-team-08/pull/34)):** While logging a later meal, a caregiver can mark a food as trying a suggestion saved earlier and pick that suggestion in the food editor.
- **Clearer recommendation input ([#38](https://github.com/snuhcs-course/swpp-2026-project-team-08/pull/38)):** The model prompt describes outcomes, difficulty reasons, and cooking methods in plain language. A suggestion starts from a food the child struggled with and takes one small step toward a familiar food, without inventing a reaction that was not recorded.
- **Privacy policy and client release setup ([#33](https://github.com/snuhcs-course/swpp-2026-project-team-08/pull/33), [#39](https://github.com/snuhcs-course/swpp-2026-project-team-08/pull/39)):** Consent, the meal privacy sheet, and My Page open the privacy policy. Client deployment uses EAS and a GitHub Actions workflow. The iOS build enables scene support, and the app icon was updated.
- **Onboarding completion and draft behavior ([#37](https://github.com/snuhcs-course/swpp-2026-project-team-08/pull/37)):** Completing onboarding shows a waiting state, blocks a second submit, and retries by sending the profile again. Safe Foods match the product rules, and Review keeps "not answered" separate from "none."
- **Suggestion checks ([#30](https://github.com/snuhcs-course/swpp-2026-project-team-08/pull/30)):** Evaluation tests compare generated suggestions with ground-truth cases. Tests use a fake model and do not call OpenRouter.

### Current demo limitations

- Email-change code generation and confirmation exist, but delivery by email is not connected.
- My Page's tutorial/help entry is visible and disabled because that guide is not implemented.
- Native photo files remain on the device. This demo does not sync photo files across devices.

## Demo Video

The short iteration 4 demo video will be added to the root of this branch.

## Setup and Execution

The repository has a FastAPI backend in `server/` and an Expo / React Native app in `client/`. Start the server first, then the app. Commands below are for a fresh local demo database and a bash/zsh terminal. They follow the iteration 3 demo setup.

### Prerequisites

- Git
- Node.js matching `client/package.json`: 22.13+ on 22.x, 24.3+ on 24.x, or 26+; npm
- Python 3.12 or later and `uv`
- Docker with Docker Compose for local PostgreSQL
- An Expo Go client compatible with Expo SDK 58, or a local native build with Android Studio/JDK/Android SDK (Android) or macOS/Xcode/CocoaPods (iOS)
- An OpenRouter API key for the personalized-suggestion portion of the demo

### 1. Clone the demo branch

```bash
git clone --branch iteration-4-demo --single-branch https://github.com/snuhcs-course/swpp-2026-project-team-08.git
cd swpp-2026-project-team-08
```

### 2. Run the server

```bash
cd server
uv sync --frozen
# First setup only: preserve an existing .env.
if [ ! -f .env ]; then cp .env.example .env; fi
```

Edit the local `.env` and set `OPENROUTER_API_KEY` before trying suggestions. Keep the file private. The supplied local database defaults work with the Compose configuration. Use a separate `JWT_SECRET_KEY` outside local development.

```bash
docker compose up -d --wait
uv run alembic upgrade head
uv run python scripts/load_ingredients.py --check
uv run python scripts/load_ingredients.py
uv run uvicorn app.main:app --reload --host 0.0.0.0
```

The migration and catalog import commands write to the database configured in `.env`. Use the local demo database. The catalog import is required for a fresh database and loads 1,613 ingredients and 18,711 restriction judgments. The `--check` command only validates the bundled data.

- API docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health check: [http://localhost:8000/health](http://localhost:8000/health)
- The server can start without an OpenRouter key, but recommendation generation will fail.

### 3. Run the mobile app

In a second terminal, start from the repository root:

```bash
cd client
npm ci
```

Set the API address for the device. Replace the example LAN address with the computer's address. The phone and computer must be able to reach each other.

| Runtime | Example `EXPO_PUBLIC_API_URL` |
|---|---|
| Physical phone on the same network | `http://192.168.0.10:8000` |
| Android Studio emulator | `http://10.0.2.2:8000` |
| iOS Simulator on the server's Mac | `http://localhost:8000` |

```bash
export EXPO_PUBLIC_API_URL=http://192.168.0.10:8000
npx expo start
```

Scan the QR code with an Expo SDK 58-compatible Expo Go client. If the installed Expo Go client cannot run this SDK or a required native module, stop Metro and build the app locally from `client/` after installing the relevant platform tools:

```bash
# Choose one platform; retain the API address set above.
npx expo run:android
# Or, on macOS:
npx expo run:ios
```

For an Android emulator, change the exported API address to `http://10.0.2.2:8000` before starting or building the app. For a standalone release APK or iOS build, follow [client/docs/deploy.md](client/docs/deploy.md).

The demo uses npm and the committed `client/package-lock.json`.

## Development Environment

The development and execution environment is the one recorded for the iteration 3 demo on 6 November 2026. Dependencies were reused from that local installation. This iteration 4 branch keeps the same toolchain: Expo SDK 58, React Native 0.88.0, React 19.3.0, FastAPI on port 8000, and PostgreSQL 16.

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

Run these from the directory named in the table. Tests use a fake LLM and do not verify live model responses.

| Area | Commands (run inside that directory) |
|---|---|
| `client/` | `npm run lint`, `npx tsc --noEmit`, `npm test` |
| `server/` | `uv run pytest`, `uv run ruff check .`, `uv run ruff format --check .` |
| Ingredient data (`server/`) | `uv run python scripts/load_ingredients.py --check` |

## Docs

- [Food ingredient and restriction ids](docs/food-ingredient-restriction-ids.md): shared allergy, dietary-pattern, and restriction values, and how the ingredient catalog is judged
