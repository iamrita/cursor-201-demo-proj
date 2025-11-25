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
  imdbId?: string;
  imdbUrl?: string;
}

export interface CastMember {
  id: number;
  name: string;
  character?: string;
  order?: number;
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

