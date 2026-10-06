# Shared UI Components — Design Specification

## Purpose

This document defines the reusable visual and interaction rules for NurtureBites components across onboarding, Home, Meal Check-in, After-meal Review, and Exposure Tracker. Feature screens compose these components; they should not independently redefine their geometry or visual states.

The values below are read from the Figma frames linked in each section. Figma uses 390 px-wide mobile frames. Unless a screen states otherwise, use **1 Figma px = 1 Android dp** for layout measurements and map Figma text px to Android `sp`. Insets occupied by the operating system are outside the screen content measurements.

## Figma source and visual families

The file contains more than one visual pass. The differences are visible in the source frames, so components have named visual families rather than one blended token set. Use the family assigned to the feature in this table. A Figma change to a family updates the corresponding values here.

| Family | Source frame | Background / border | Main text / secondary text | Accent | Type |
|---|---|---|---|---|---|
| Onboarding | [Caregiver account](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/%25EC%2586%258C%25EA%25B0%259C%25EC%259B%2590%25EC%258B%25A4?node-id=32-1183), [Food allergies](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/%25EC%2586%258C%25EA%25B0%259C%25EC%259B%2590%25EC%258B%25A4?node-id=52-118) | `#EEF7FF` / `#C9DAED` | `#10233F` / `#667892` | `#1667FF` | Inter |
| Home and meal setup | [Home](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/%25EC%2586%258C%25EA%25B0%259C%25EC%259B%2590%25EC%258B%25A4?node-id=37-3369), [Meal details](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/%25EC%2586%258C%25EA%25B0%259C%25EC%259B%2590%25EC%258B%25A4?node-id=94-191), [Meal Check-in](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/%25EC%2586%258C%25EA%25B0%259C%25EC%259B%2590%25EC%258B%25A4?node-id=34-2779) | `#F7FAFF` / `#DCE6F3` | `#13233A` / `#66758A` | `#1769FF` | Poppins |
| Food review and Tracker | [Food outcomes](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/%25EC%2586%258C%25EA%25B0%259C%25EC%259B%2590%25EC%258B%25A4?node-id=72-110), [Review food](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/%25EC%2586%258C%25EA%25B0%259C%25EC%259B%2590%25EC%258B%25A4?node-id=96-821), [Exposure Tracker](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/%25EC%2586%258C%25EA%25B0%259C%25EC%259B%2590%25EC%258B%25A4?node-id=39-5093) | Food outcomes: `#F7FBFF` / `#CADDF0`; review/Tracker: `#F5F8FE` / `#D8E3F2` | Food outcomes: `#173B64` / `#71809A`; review/Tracker: `#13233A` / `#65758B` | `#1769FF` | Inter and Poppins as specified by the source screen |

The Figma file does not establish a single app-wide font or canvas color. Do not silently replace the feature-family values above with one global value. When a new feature has no corresponding source frame, use the Home and meal setup family as its starting point and add a feature-specific row here only after its Figma design is approved.

### Common color roles

| Role | Onboarding | Home / meal setup | Food review / Tracker |
|---|---|---|---|
| Canvas | `#EEF7FF` | `#F7FAFF` | `#F7FBFF` or `#F5F8FE` by screen |
| Primary text | `#10233F` | `#13233A` | `#173B64` or `#13233A` by screen |
| Secondary text | `#667892` | `#66758A` | `#71809A` or `#65758B` by screen |
| Primary action | `#1667FF` | `#1769FF` | `#1769FF` |
| Control border | `#C9DAED` | `#DCE6F3` | `#CADDF0` or `#D8E3F2` by screen |
| Selected surface | `#F3F8FF` | `#EAF2FF` | `#EAF2FF` |
| Error | `#D92D20` | Not specified | Review status uses `#C43D4B` for red category tags |
| Positive status | `#19875F` | `#16A34A` | `#16A34A` |

## Component specifications

### 1. Screen surface and system inset

| Property | Specification |
|---|---|
| Reference size | 390 × 844 px for onboarding, Home, Meal Check-in and Tracker examples; some meal detail screens are 818–879 px tall. |
| Onboarding surface | Fill `#EEF7FF`, 1 px `#C9DAED` outline, 24 px outer corner radius. |
| Home / meal surface | Fill `#F7FAFF`, 1 px `#DCE6F3` outline, 28 px outer corner radius. |
| Review surface | Use the relevant food review family: outcomes uses 30 px corners; photo-review frames use 28 px corners. |
| System status area | Onboarding frame reserves 38 px at the top; Home and meal frames reserve 44 px. These are Figma content origins, not Android inset values. Do not draw a fake status bar in Android: use the platform inset, then preserve the remaining design spacing so the app header starts at the corresponding Figma y-position. |
| Horizontal content inset | Onboarding 22 px; Home and meal setup 24 px; After-meal outcomes 18 px. Keep these as screen-family gutters; child components fill the remaining width. |

### 2. Typography

Figma sizes are listed in px; use the same numeric `sp` value in Android. Line heights are ratios where shown.

| Text role | Size / line height | Weight | Color / use |
|---|---:|---|---|
| Screen title, onboarding | 20 px / 1.08 | Inter Bold | Onboarding primary text |
| Screen title, meal setup | 17 px | Poppins SemiBold | Home/meal family app bar |
| Screen title, home | 17 px | Poppins SemiBold | Home greeting |
| Screen title, food outcomes | 17 px in the screen heading | Inter/Poppins per node | Outcomes family |
| Section title | 11–12 px | Bold or SemiBold | Card and section headings |
| Body and field value | 10–11 px | Regular or Medium | Main copy, entered values |
| Field label | 9 px, uppercase in onboarding | Inter ExtraBold | Above a field; `#10233F` |
| Supporting text | 9–10 px | Regular or Medium | Helper copy, descriptions |
| Metadata / status | 8–9 px | Bold or Medium | Step labels, autosave, tiny badges |

Use the font family specified by the screen family. Keep labels and status copy short enough for the 390 px frame; allow content descriptions to wrap instead of clipping.

### 3. Text input

Two sizes are present; select by feature family. The 40 px onboarding input is a compact Figma control, while app forms use a taller 46 px control.

| Variant | Height | Horizontal padding | Gap / radius | Surface and outline | Text |
|---|---:|---:|---:|---|---|
| `Onboarding` | 40 px | 11 px | Label-to-field gap 3 px; radius 8 px | White; 1 px `#C9DAED` | 10 px Inter Regular, `#10233F` |
| `MealForm` | 46 px | 12 px | Label-to-field gap 5 px; radius 10 px | White; 1 px `#DCE6F3` | 10 px Poppins, `#13233A` |

**Anatomy and states**

- Field label sits above the field. Onboarding labels are 9 px uppercase Inter ExtraBold; meal-form labels use the screen's Poppins label style.
- Placeholder uses the secondary-text color. Entered text uses the primary-text color.
- Onboarding password validation error uses a 1 px `#D92D20` outline and an 8 px `#D92D20` helper line below the field. Keep the error line in layout; do not overlay it on the input.
- The Figma file shows a blue focus/active outline on the child age/name form and typing frames for catalog search. Use the current family accent for focus. Typing frames show suggestions below the field, attached to the input width.
- Do not constrain text vertically below the selected variant height. For native Material `OutlinedTextField`, the Figma compact height may be too small for default internal padding; use a custom decoration or a larger minimum height so the value, cursor, and placeholder stay fully visible. Height is a target, clipping is never acceptable.
- 두 기능의 입력값은 밝은 입력 배경 위에 진한 글자색으로 표시한다. 비밀번호 8글자 미만의 오류 테두리와 안내 문구는 Figma의 붉은색 상태를 따른다.
- Meal Details의 월·일·연도 필드는 날짜 카드 안에 펼쳐진다. 각 선택 목록은 카드의 자식 레이아웃이 아닌 별도 오버레이로 표시해 목록을 열고 닫아도 카드 높이가 바뀌지 않게 한다. 목록은 앱의 밝은 화면 팔레트를 사용해 숫자와 선택 상태를 구분한다.
- 키보드가 열리면 입력 필드와 하단 동작 버튼이 IME 위로 이동하고, 긴 양식은 스크롤해서 현재 입력을 볼 수 있어야 한다.
- 화면 아이콘과 Meal Check-in의 예시 식사 사진은 각 Figma 프레임에서 내려받은 자산을 사용한다.
- Disabled, read-only, and counter states are not defined in these frames. Do not invent colors; add their tokens to this document when product behavior requires them.

### 4. Choice row and checkbox

| Property | Multi-select row |
|---|---|
| Minimum height | 34 px; content may grow if a title/helper wraps |
| Horizontal / vertical padding | 9 px / 6 px |
| Text-to-control gap | 8 px |
| Row corner radius | 11 px |
| Row spacing | 4 px |
| Unselected fill / outline | White / 1 px family border |
| Selected fill / outline | Onboarding `#F3F8FF` / 1 px `#1667FF`; use equivalent selected-surface/accent tokens for other families |
| Checkbox | 20 × 20 px, 6 px corner radius; selected fill is the family accent |
| Label | 10 px, Inter Medium in onboarding; trailing descriptor may use 9 px secondary text |

Selection rows are full-width click targets; tapping either the row or checkbox changes the same selection exactly once. For exclusive “none” choices, selecting it clears the other choices; selecting any other option clears “none.” A single-choice prompt uses the same row geometry but permits only one selected row. If the question has a catalog search, retain the 3 px label/field gap, show a bordered suggestion surface directly below the input, and use a checkmark on an already-selected result.

### 5. Information and safety banner

| Property | Standard info | Safety guidance |
|---|---|---|
| Padding | 10 px horizontal, 8 px vertical | 8 px all around |
| Radius | 9 px | 11 px |
| Surface | `#E6F1FF` | `#FFF0F2` in allergy guidance |
| Icon | 16 px visual glyph/icon at text start | 24 px white circular icon container; icon 13 px |
| Text | 9 px / 12 px line height, `#3E5878` | Title 10 px Medium `#D43D4B`; body 9 px / 1.35 `#10233F` |
| Content spacing | 8 px from preceding content | Icon-to-copy 8 px; title-to-body 2 px |

Use for concise guidance that changes how a caregiver should interpret an answer. Do not use a banner as a replacement for inline field validation.

### 6. Progress indicators

#### Onboarding progress

- Step/status row spans the 346 px content width between 22 px gutters; top offset 3 px within the header.
- Step label: 9 px uppercase Inter ExtraBold, `#1667FF`.
- Autosave status: 13 px icon, 4 px icon-to-label gap, 8 px Inter Bold, `#19875F`.
- Row-to-track gap: 6 px. Track and fill height: 3 px; pill radius 999 px. Track `#D5E3F1`, fill `#1667FF`.
- Heading begins 3 px below the progress track. The header uses 6 px group spacing and 22 px horizontal gutters.

#### Meal-flow segmented progress

- Five equal-width segments in the shown Meal Check-in and Meal Details flows.
- Horizontal page inset 24 px; segment gap 6 px; segment height 4 px; radius 999 px.
- Completed/current segment `#1769FF`; remaining segment `#DCE6F3`.
- Keep the Back control/header above the progress row: app-bar horizontal 24 px, 8 px top and 10 px bottom, 12 px gap between back button and heading.

### 7. Buttons

| Variant | Height / width | Padding / radius | Appearance |
|---|---|---|---|
| Onboarding Previous | 46 px high, 96 px wide in the 390 px frame | Radius 11 px | White, 1 px `#C9DAED` border, 11 px Inter Bold `#10233F` |
| Onboarding Continue / Looks good | 46 px high, takes remaining width | Radius 11 px | `#1667FF`, white 11 px Inter Bold, shadow `0 7 18 0 rgba(22,103,255,0.13)` |
| Meal-form primary | 52 px high, full content width | 16 px horizontal padding, radius 14 px | `#1769FF`, white 14 px Poppins SemiBold |
| Meal-form secondary | 52 px high, full content width | 16 px horizontal padding, radius 14 px | White, 1 px `#DCE6F3`, `#1769FF` 14 px Poppins SemiBold |
| Outcome primary / Skip | 48 px high, full width | 16 px horizontal padding, radius 999 px | Primary `#1769FF`; secondary white with 1 px `#CADDF0` |
| Compact Add | 72 px wide on the outcomes form | 12 px horizontal and 10 px vertical padding, radius 12 px | `#1769FF`, white 10 px Inter Bold |
| Icon-only Back / Close | 36–38 px square | Radius 999 px | White; subtle shadow or 1 px family border; icon 18 px |

Onboarding footer: white surface with a 1 px top border, top corners 20 px, height 77 px. Place actions 22 px from each side, 14 px from the top, 5 px from the bottom, and 8 px apart. The primary button expands to fill the remaining width. Meal-flow actions stay within the content column and use 14 px corner radius unless the source specifically uses pill buttons. On Android, account for the native navigation-bar inset outside this 77 px Figma footer measurement.

### 8. Cards and selectable tiles

| Component | Geometry | Surface / shadow | Content spacing |
|---|---|---|---|
| Home “Next up” meal action | Full width inside 24 px gutter; radius 22 px | `#13233A`; shadow `0 12 28 0 rgba(57,45,69,0.13)` | 20 px padding; 15 px between card copy and action |
| Home widget card (SOS Progress, Recommended goals, Calendar) | Full width; radius 20 px | White; shadow `0 8 24 0 rgba(57,45,69,0.07)` | 16 px padding; 14 px section spacing; home sections 18 px apart |
| Meal type / setting tile | 76 px high; radius 16 px | White; 1 px `#DCE6F3`; shadow `0 8 24 0 rgba(57,45,69,0.07)` | 14 px padding; icon tile 42 × 42 px, radius 10 px; icon-to-copy gap 12 px |
| Review dish card | Width 342 px in 390 px frame; radius 14 px | White; 1 px `#D8E3F2` | 12 px padding; 10 px between card fields; dish cards 12 px apart |
| Safety guidance card | Full width in the question column; radius 11 px | `#FFF0F2` | 8 px padding; 8 px icon-to-text gap |

Home screen content uses 24 px side gutters, 10 px top padding after the date header, and 24 px bottom padding before bottom navigation. The Meal Details content uses 24 px side gutters. The Review food screens use 18–24 px gutters as shown by their source frame; preserve the feature family rather than forcing one global card width.

**Home card contents**

- “Next up” meal action card: x=24 px, width 342 px, height 194 px. The inner copy is x=20, y=20, width 302 px. Primary action is x=20, y=120, 302 × 54 px; camera icon 18 px, 9 px icon-to-label gap. It is a dark navy card, not a generic white widget.
- SOS Progress widget: x=24 px, width 342 px, height 211 px, using the standard white widget card. Inner content width 310 px at x=16. Header is 41 px high; item rows begin at y=71. Row icon is 40 × 40 px; icon-to-copy gap 12 px. Food title and stage align in one 21 px row; helper copy begins 4 px below. Between rows use a 1 px divider, then 14 px vertical separation.
- Recommended action goals widget: x=24 px, width 342 px, height 140 px. One 53 px goal row begins at y=71. Icon is 40 × 40 px, radius 14 px; icon-to-copy gap 12 px. The “Try” action is a 37 × 27 px pill, `#F0F4FF`, 10 px horizontal and 6 px vertical padding.
- Meal Log Calendar widget: see the separate calendar specification below.

### 9. Meal log calendar

The Home calendar is a white widget card at x=24 px, width 342 px, with 16 px inner padding and 20 px corner radius. Its internal layout is 310 px wide.

- Header: 40 px high. Title and description stack at the leading edge; month pill is 44 × 27 px, placed 6.5 px below the header top. Header-to-weekday gap is 14 px.
- Weekday row: seven 40 × 15 px cells with 6 px horizontal gaps. Labels use 10 px Poppins Bold, `#95A2B3`.
- Calendar: four visible week rows, each 40 px high. Day cells are 40 × 40 px with 12 px corners. Horizontal gap is 6 px; vertical row gap is 8 px.
- Unlogged day: `#F0F4FF` fill, `#13233A` 12 px Poppins SemiBold. Logged/selected day: `#1769FF` fill, white 12 px Poppins Bold.
- The widget uses 14 px spacing between its sections and a 14 px radius is not applicable to day cells; do not reuse the card radius for individual dates.

Reference: [Home calendar widget](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/%25EC%2586%258C%25EA%25B0%259C%25EC%259B%2590%25EC%258B%25A4?node-id=37-3369). This is the only calendar frame in the file; the Insight destination does not have a comparable chart specification here.

### 10. Tags, status pills, and chips

- Pill shape: radius 999 px. Standard status pill padding 10 px horizontal and 6 px vertical; compact provenance/tag padding 8 px horizontal and 5 px vertical; icon-to-label gap 5 px.
- Home status pill background: `#EAF2FF` or `#F0F4FF`, blue label.
- Food-review provenance tags distinguish source: AI suggestion pink `#FCE8EC`, past data blue `#EAF1FF`, parent input green `#E8F7EE`. Preserve both label and color; color alone must not carry meaning.
- Ingredient and serving tags use the same pill geometry with their semantic family colors. The screenshot's allergen tag uses `#FFF1F3`; do not reuse it as a success or neutral tag.
- Selected and removable ingredient tags show a compact remove affordance after the label. Do not remove a tag without an explicit user action.

### 11. Dropdown and autocomplete menu

The After-meal Review category/value editor shows a two-dropdown row and an Add action.

- Row spacing: 8 px. Category dropdown: 170 px wide; value dropdown takes remaining width; Add action: 72 px wide.
- Dropdown padding: 12 px horizontal and 10 px vertical; radius 12 px; white surface; 1 px `#CADDF0` outline; text 10 px Inter Regular; trailing chevron 14 px.
- Add button uses the compact Add variant above.
- Suggestion menu: 170 px wide, white, radius 10 px, shadow `0 6 14 0 rgba(16,35,63,0.08)`, family border. Row height 27 px, 10 px horizontal padding, 6 px vertical padding; 12 px leading icon and 8 px icon-to-label gap. Hover/active row uses `#F5F8FD`.
- A selected suggestion remains visibly selected and gets a checkmark. The menu opens below its field without changing the field's width.

### 12. Photo frame and photo actions

Meal Check-in photo preview uses a full-width image slot inside the 24 px content gutter, with a 1 px `#DCE6F3` border and 14 px radius. Crop with `ContentScale.Crop` for the meal-photo card; the full-view photo screen preserves the photo's aspect ratio inside a bordered frame. Place the preview-specific actions directly below the image: Replace and Remove are equal-width 44 px controls, 8 px apart; the “Use this photo” primary action is 50 px high with 14 px radius. The photo consent note is `#EFF6FF`, 1 px family border, 12 px padding and 12 px radius.
The full-view photo is a dedicated screen with its own Go back action; it uses the available viewport instead of a small centered dialog.

These frames specify presentation only. Ask for camera/photo permission only after the caregiver selects the corresponding photo action, as required by the onboarding product spec.

### 13. Bottom navigation

Home has six destinations: Today, Meal log, SOS, Ideas, Insight, Profile.

- Bar height: 72 px in the Figma frame; white background; 1 px `#EDF3FB` top border. Add the Android navigation-bar inset outside this measured content height.
- Content padding: 22 px horizontal, 10 px top, 12 px bottom.
- Six items share the available width; Figma item width is 62 px at 390 px viewport.
- Icon: 20 px. Label: 8–9 px; icon-to-label gap 4 px.
- Selected item uses the active blue; inactive items use secondary gray. Always keep a visible label; do not communicate selected state through color alone.

Reference: [Home bottom navigation](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/%25EC%2586%258C%25EA%25B0%259C%25EC%259B%2590%25EC%258B%25A4?node-id=37-3369).

### 14. Bottom sheet and Exposure Tracker ladder

The Exposure Tracker companion is a bottom sheet over a dimmed Review food screen.

- Sheet bounds: full frame width 390 px; top at y=455 px in an 844 px frame; height 389 px; white fill; top corners 20 px (the screenshot shows a rounded sheet). Bottom aligns with the frame bottom.
- Handle region: 390 × 22 px; handle 38 × 4 px, centered, 9 px from region top.
- Panel content begins 22 px below the sheet top. Header x=18 px; header size 354 × 51 px. Close action is 36 × 36 px, 18 px from the right content edge.
- Six-step ladder panel: x=18 px, width 354 px, height 100 px, y=121 px within panel content. Inner horizontal inset 12 px. Six equal steps are 51.67 × 52 px with 4 px gaps. Each marker is 36 × 36 px; labels sit beneath markers.
- Keep “Open the Tracker” as a distinct action from the ladder display and retain a clear route back to food review.

Reference: [Exposure Tracker companion](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/%25EC%2586%258C%25EA%25B0%259C%25EC%259B%2590%25EC%258B%25A4?node-id=39-5093).

## Screen composition values

These screen-level values explain how the reusable pieces fit together. They are not additional variants for a child component to choose independently.

| Screen family | Main horizontal inset | Section spacing | Fixed actions |
|---|---:|---:|---|
| Onboarding question screen | 22 px | Header groups 6 px; content stack 7 px; choice rows 4 px | 77 px bottom footer; 46 px buttons |
| Home | 24 px | Home section blocks 18 px; widget internals 14 px | 72 px bottom navigation |
| Meal Details | 24 px | Meal/setting options 10 px; tile rows 10 px | 52 px primary action |
| Meal Check-in | 24 px | Main content blocks 10 px; card inner top/bottom padding 14 px | 52 px primary and secondary actions |
| After-meal food outcomes | 18 px | Page content blocks 12 px; outcome cards 5 px; row contents 7–8 px | 48 px primary and Skip buttons |
| Review food / Exposure | 24 px review content; 18 px sheet inset | Dish card fields 5–10 px | Review confirm 50 px; sheet actions inside panel |

## Interaction and state requirements

- Every tappable row, card, dropdown, or button exposes one semantic click action and a visible state appropriate to the component. Nested checkbox/row click handling must not toggle twice.
- Selection state belongs to the screen/ViewModel. Shared components receive `selected`, `enabled`, values, and callbacks as parameters; they do not read repositories or own business state.
- A field's error/helper line expands the vertical layout below that field. It must not overlap the next control.
- Progress is derived from the current flow step. Do not hard-code a fill width from one screenshot.
- Keep safe, allergen, parent-provided, prior-data, and AI-suggested tags semantically distinct.
- Respect system bars, keyboard insets, and scrolling on compact devices. Fixed action bars stay reachable when the keyboard is open; scroll content rather than clipping fields.

## Unspecified states and design follow-up

Figma provides examples for default and selected choice rows, active text fields, an account validation error, autocomplete results, photo preview, and the open Tracker sheet. It does not consistently define disabled/loading states, error banners outside the password example, pressed/focused button treatments, dark mode, or the tutorial screen visuals. Until design supplies them, follow Material interaction/accessibility behavior without inventing a new visual palette, and add the final state values here when approved.

The file also has visible version differences in app background, typography, gutters, and button radius. This specification preserves those differences by screen family. If the team wants one unified design system, the designer should first designate replacement Figma frames; code should not choose a winner implicitly.
