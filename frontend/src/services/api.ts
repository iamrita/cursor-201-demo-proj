import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Actor {
  id: number;
  name: string;
  profile_path?: string;
  known_for?: Array<{
    title?: string;
    name?: string;
    media_type: string;
  }>;
}

export interface Movie {
  id: number;
  title: string;
  release_date?: string;
  poster_path?: string;
  imdb_id?: string;
}

export interface PathStep {
  type: 'actor' | 'movie';
  data: Actor | Movie;
}

export interface PathResult {
  path: PathStep[];
  degrees: number;
  backendDurationMs?: number;
}

export const searchActors = async (query: string): Promise<Actor[]> => {
  const response = await api.get<Actor[]>('/search', {
    params: { q: query },
  });
  return response.data;
};

export const findPath = async (
  actor1Id: number,
  actor2Id: number
): Promise<PathResult> => {
  const response = await api.post<PathResult>('/path', {
    actor1Id,
    actor2Id,
  });
  return response.data;
};

