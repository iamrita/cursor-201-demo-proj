import { useState } from 'react';
import ActorSearch from './components/ActorSearch';
import ConnectionPath from './components/ConnectionPath';
import { Actor, PathResult, findPath } from './services/api';

function App() {
  const [actor1, setActor1] = useState<Actor | null>(null);
  const [actor2, setActor2] = useState<Actor | null>(null);
  const [result, setResult] = useState<PathResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frontendDurationMs, setFrontendDurationMs] = useState<number | null>(null);

  const handleFindPath = async () => {
    if (!actor1 || !actor2) {
      setError('Please select both actors');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setFrontendDurationMs(null);

    const startTime = Date.now();
    try {
      const pathResult = await findPath(actor1.id, actor2.id);
      const endTime = Date.now();
      const frontendDurationMs = endTime - startTime;
      
      setResult(pathResult);
      setFrontendDurationMs(frontendDurationMs);
    } catch (err: any) {
      const endTime = Date.now();
      const frontendDurationMs = endTime - startTime;
      setFrontendDurationMs(frontendDurationMs);
      
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to find connection. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Between Two Stars
          </h1>
          <p className="text-gray-600">
            Find the connection between any two actors through their movies.
          </p>
        </header>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ActorSearch
                label="Actor 1"
                onSelect={setActor1}
                selectedActor={actor1}
              />

              <ActorSearch
                label="Actor 2"
                onSelect={setActor2}
                selectedActor={actor2}
              />
            </div>

            <button
              onClick={handleFindPath}
              disabled={!actor1 || !actor2 || isLoading}
              className="w-full py-3 px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Finding Connection...' : 'Find Connection'}
            </button>
          </div>
        </div>

        <ConnectionPath 
          result={result} 
          isLoading={isLoading} 
          error={error}
          frontendDurationMs={frontendDurationMs}
        />
      </div>
    </div>
  );
}

export default App;

