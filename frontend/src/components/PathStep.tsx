import { PathStep as PathStepType, Actor, Movie } from '../services/api';

interface PathStepProps {
  step: PathStepType;
  isLast: boolean;
}

export default function PathStep({ step, isLast }: PathStepProps) {
  if (step.type === 'actor') {
    const actor = step.data as Actor;
    return (
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center">
          {actor.profile_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w92${actor.profile_path}`}
              alt={actor.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-blue-500"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center border-2 border-blue-500">
              <span className="text-gray-600 text-xs">No Image</span>
            </div>
          )}
          <span className="mt-2 text-sm font-medium text-gray-900 max-w-[120px] text-center">
            {actor.name}
          </span>
        </div>
        {!isLast && (
          <div className="text-2xl text-gray-400">→</div>
        )}
      </div>
    );
  } else {
    const movie = step.data as Movie;
    const imdbUrl = movie.imdb_id ? `https://www.imdb.com/title/${movie.imdb_id}/` : null;
    return (
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center">
          {movie.poster_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
              alt={movie.title}
              className="w-16 h-24 object-cover rounded border-2 border-purple-500"
            />
          ) : (
            <div className="w-16 h-24 bg-gray-300 rounded flex items-center justify-center border-2 border-purple-500">
              <span className="text-gray-600 text-xs text-center px-1">
                No Poster
              </span>
            </div>
          )}
          <span className="mt-2 text-sm font-medium text-gray-900 max-w-[120px] text-center">
            {movie.title}
          </span>
          {movie.release_date && (
            <span className="text-xs text-gray-500">
              {new Date(movie.release_date).getFullYear()}
            </span>
          )}
          {imdbUrl && (
            <a
              href={imdbUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 text-xs font-semibold text-yellow-600 hover:text-yellow-700"
            >
              View on IMDb ↗
            </a>
          )}
        </div>
        {!isLast && (
          <div className="text-2xl text-gray-400">→</div>
        )}
      </div>
    );
  }
}

