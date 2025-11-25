import { PathResult, Actor, Movie } from '../services/api';
import PathStep from './PathStep';

interface ConnectionPathProps {
  result: PathResult | null;
  isLoading: boolean;
  error: string | null;
  frontendDurationMs: number | null;
}

export default function ConnectionPath({
  result,
  isLoading,
  error,
  frontendDurationMs,
}: ConnectionPathProps) {
  if (isLoading) {
    return (
      <div className="mt-8 p-8 bg-white rounded-lg shadow-md">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Finding the connection...</p>
          <p className="text-sm text-gray-500 mt-2">
            This may take a moment
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-red-600 text-xl">⚠️</span>
          <div>
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const formattedPath = result.path
    .map((step) =>
      step.type === 'actor'
        ? (step.data as Actor).name
        : (step.data as Movie).title
    )
    .join(' → ');

  return (
    <div className="mt-8 p-8 bg-white rounded-lg shadow-md">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Connection Found!
        </h2>
        <p className="text-lg text-gray-600 mb-2">
          Degrees of Separation: <span className="font-bold text-blue-600">{result.degrees}</span>
        </p>
        {frontendDurationMs !== null && (
          <p className="text-sm text-gray-500">
            Total time: <span className="font-medium text-gray-700">{frontendDurationMs.toFixed(0)}ms</span>
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 p-6 bg-gray-50 rounded-lg overflow-x-auto">
        {result.path.map((step, index) => (
          <PathStep
            key={`${step.type}-${step.data.id}-${index}`}
            step={step}
            isLast={index === result.path.length - 1}
          />
        ))}
      </div>

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Path: {formattedPath}</p>
      </div>
    </div>
  );
}

