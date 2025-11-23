# Six Degrees of Kevin Bacon - TMDB Edition

A web application that finds the connection path between any two actors through their movies, similar to the Oracle of Bacon, using the TMDB (The Movie Database) API.

## Features

- **Actor Search**: Search for actors with autocomplete suggestions
- **Pathfinding**: Find the shortest connection path between two actors through movies
- **Visualization**: Display the connection path with actor photos and movie posters
- **Degrees of Separation**: Calculate and display the degrees of separation between actors

## Tech Stack

### Backend
- Node.js with Express
- TypeScript
- TMDB API integration
- Breadth-First Search (BFS) algorithm for pathfinding

### Frontend
- React with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Axios for API calls

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- TMDB API key (get one at https://www.themoviedb.org/settings/api)

## Setup Instructions

### 1. Install Dependencies

Install dependencies for all projects:

```bash
npm run install:all
```

Or install them separately:

```bash
# Root dependencies
npm install

# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 2. Configure TMDB API Key

1. Copy the `.env.example` file in the `backend` directory to `.env`:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Open `backend/.env` and add your TMDB API key:
   ```
   TMDB_API_KEY=your_actual_api_key_here
   ```

### 3. Run the Application

You need to run both the backend and frontend servers simultaneously.

**Terminal 1 - Backend Server:**
```bash
cd backend
npm run dev
```

The backend server will start on `http://localhost:3001`

**Terminal 2 - Frontend Server:**
```bash
cd frontend
npm run dev
```

The frontend server will start on `http://localhost:3000`

### 4. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## Project Structure

```
cursor-201-demo-proj/
├── backend/
│   ├── src/
│   │   ├── server.ts              # Express server setup
│   │   ├── routes/
│   │   │   └── actors.ts          # API routes
│   │   ├── services/
│   │   │   ├── tmdb.ts            # TMDB API client
│   │   │   └── pathfinder.ts      # BFS pathfinding algorithm
│   │   └── types/
│   │       └── index.ts           # TypeScript types
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                        # Your API key (create from .env.example)
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ActorSearch.tsx    # Actor search with autocomplete
│   │   │   ├── ConnectionPath.tsx # Path visualization
│   │   │   └── PathStep.tsx       # Individual path step
│   │   ├── services/
│   │   │   └── api.ts             # API client
│   │   ├── App.tsx                # Main app component
│   │   ├── main.tsx               # Entry point
│   │   └── index.css              # Tailwind CSS
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
└── README.md
```

## API Endpoints

### `GET /api/search?q=query`
Search for actors by name.

**Query Parameters:**
- `q` (string, required): Search query

**Response:**
```json
[
  {
    "id": 123,
    "name": "Actor Name",
    "profile_path": "/path/to/image.jpg",
    "known_for": [...]
  }
]
```

### `POST /api/path`
Find the connection path between two actors.

**Request Body:**
```json
{
  "actor1Id": 123,
  "actor2Id": 456
}
```

**Response:**
```json
{
  "path": [
    { "type": "actor", "data": {...} },
    { "type": "movie", "data": {...} },
    { "type": "actor", "data": {...} }
  ],
  "degrees": 2
}
```

## How It Works

1. **Actor Search**: When you type an actor's name, the app queries the TMDB API and displays matching actors with their photos and known works.

2. **Pathfinding**: When you select two actors and click "Find Connection", the backend uses a Breadth-First Search (BFS) algorithm to:
   - Start from Actor 1
   - Explore all movies Actor 1 was in
   - For each movie, check if Actor 2 is in the cast
   - If not found, explore all actors in those movies and repeat
   - Continue until a path is found or all possibilities are exhausted

3. **Visualization**: The connection path is displayed showing:
   - Actor photos (circular)
   - Movie posters (rectangular)
   - Arrows indicating the connection flow
   - Degrees of separation count

## Troubleshooting

### Backend won't start
- Make sure you've created the `.env` file in the `backend` directory
- Verify your TMDB API key is correct
- Check that port 3001 is not already in use

### Frontend won't start
- Check that port 3000 is not already in use
- Make sure the backend server is running first

### No results found
- Verify your TMDB API key is valid and has proper permissions
- Check your internet connection
- Some actor pairs may genuinely have no connection path (very rare)

### CORS errors
- Make sure the backend server is running on port 3001
- The frontend proxy is configured in `vite.config.ts` to forward `/api` requests to the backend

## Notes

- The pathfinding algorithm may take some time for actors with extensive filmographies
- TMDB API has rate limits; the app handles rate limiting with automatic retries
- Some actors may not have profile photos or movie posters available

## License

ISC

## Credits

- Uses the [TMDB API](https://www.themoviedb.org/) for movie and actor data
- Inspired by the [Oracle of Bacon](https://oracleofbacon.org/)
