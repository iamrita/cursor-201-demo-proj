import { useState, useEffect, useRef } from 'react';
import { Actor, searchActors } from '../services/api';

interface ActorSearchProps {
  label: string;
  onSelect: (actor: Actor | null) => void;
  selectedActor: Actor | null;
}

export default function ActorSearch({
  label,
  onSelect,
  selectedActor,
}: ActorSearchProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Actor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Close suggestions when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // If query is empty, clear suggestions
    if (!query.trim()) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    // Set loading state
    setIsLoading(true);

    // Debounce search
    debounceTimer.current = setTimeout(async () => {
      try {
        const results = await searchActors(query);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error searching actors:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  const handleSelect = (actor: Actor) => {
    setQuery(actor.name);
    setShowSuggestions(false);
    onSelect(actor);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    onSelect(null);
  };

  return (
    <div className="w-full" ref={searchRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            placeholder="Search for an actor..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          {selectedActor && (
            <button
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((actor) => (
              <button
                key={actor.id}
                onClick={() => handleSelect(actor)}
                className="w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  {actor.profile_path && (
                    <img
                      src={`https://image.tmdb.org/t/p/w45${actor.profile_path}`}
                      alt={actor.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {actor.name}
                    </div>
                    {actor.known_for && actor.known_for.length > 0 && (
                      <div className="text-sm text-gray-500 truncate">
                        {actor.known_for
                          .slice(0, 2)
                          .map((item) => item.title || item.name)
                          .join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

