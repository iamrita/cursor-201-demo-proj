# Screenshots and Screen Recordings Guide

This document provides guidance for capturing screenshots and screen recordings to document the Adobe React Spectrum UI migration.

## Setup

1. Start the backend server:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. Start the frontend server (in a new terminal):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. Open your browser to `http://localhost:3000`

## Screenshots to Capture

### 1. Landing Page
- Capture the initial state showing:
  - "Between Two Stars" heading
  - Two ComboBox search fields (Actor 1 and Actor 2)
  - Disabled "Find Connection" button

### 2. Actor Search in Action
- Type "Tom Hanks" in Actor 1 field
- Capture the dropdown showing search results with loading state
- Capture the selected state with "Tom Hanks" populated

### 3. Both Actors Selected
- Select "Tom Hanks" for Actor 1
- Select "Kevin Bacon" for Actor 2
- Capture the enabled "Find Connection" button

### 4. Loading State
- Click "Find Connection"
- Capture the loading spinner (ProgressCircle) with "Finding the connection..." text

### 5. Results Page
- Capture the full connection path showing:
  - "Connection Found!" heading
  - Degrees of separation
  - Visual path with actor photos and movie posters
  - Arrows connecting the path
  - Text summary at the bottom

### 6. Error State (if applicable)
- Try an invalid search or connection that fails
- Capture the error alert with the error icon and message

### 7. Responsive Design
- Capture the UI at different screen sizes:
  - Desktop (1920x1080)
  - Tablet (768px)
  - Mobile (375px)

## Screen Recording Suggestions

Record a 30-60 second video showing:

1. Starting with empty search fields
2. Typing in Actor 1 search (e.g., "Tom Hanks")
3. Selecting from the dropdown
4. Typing in Actor 2 search (e.g., "Kevin Bacon")
5. Selecting from the dropdown
6. Clicking "Find Connection"
7. Showing the loading state
8. Displaying the final connection path
9. (Optional) Scrolling through the path if it's long

## Tools for Capturing

### Screenshots
- **macOS**: Cmd + Shift + 4 (to select area)
- **Windows**: Windows + Shift + S
- **Browser DevTools**: F12 → Device toolbar for responsive testing

### Screen Recording
- **macOS**: QuickTime Player → New Screen Recording
- **Windows**: Windows + G (Xbox Game Bar)
- **Browser Extension**: Loom, Screencastify, or similar

## Naming Convention

Use the following naming convention for files:
- `01-landing-page.png`
- `02-actor-search.png`
- `03-both-actors-selected.png`
- `04-loading-state.png`
- `05-results-page.png`
- `06-error-state.png` (if applicable)
- `07-responsive-desktop.png`
- `08-responsive-tablet.png`
- `09-responsive-mobile.png`
- `demo-walkthrough.mp4` or `demo-walkthrough.gif`

## Adding to PR

Once captured, add screenshots to the PR description using:

```markdown
### Landing Page
![Landing Page](./screenshots/01-landing-page.png)

### Actor Search
![Actor Search](./screenshots/02-actor-search.png)

... (continue for all screenshots)

### Demo Video
![Demo Walkthrough](./screenshots/demo-walkthrough.gif)
```

Or upload them directly in the GitHub PR interface.
