import { useState, useEffect } from 'react';
import { getCacheStats, clearCache, CacheStats } from '../services/api';

interface PerformanceMetricsProps {
  frontendDurationMs?: number | null;
  backendDurationMs?: number | null;
}

export default function PerformanceMetrics({ 
  frontendDurationMs, 
  backendDurationMs 
}: PerformanceMetricsProps) {
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchStats = async () => {
    try {
      const stats = await getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      console.error('Failed to fetch cache stats:', error);
    }
  };

  const handleClearCache = async () => {
    setIsLoading(true);
    try {
      await clearCache();
      await fetchStats();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const getHitRateColor = (hitRate: number) => {
    if (hitRate >= 80) return 'text-green-600';
    if (hitRate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <svg 
            className="w-6 h-6 mr-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
            />
          </svg>
          Performance Metrics
        </h2>
        <svg 
          className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isExpanded && (
        <div className="mt-6 space-y-6">
          {/* Request Timing */}
          {(frontendDurationMs !== null || backendDurationMs !== null) && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Last Request Timing</h3>
              <div className="grid grid-cols-2 gap-4">
                {frontendDurationMs !== null && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {frontendDurationMs.toFixed(0)}ms
                    </div>
                    <div className="text-sm text-gray-600">Total Time</div>
                  </div>
                )}
                {backendDurationMs !== null && (
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-600">
                      {backendDurationMs.toFixed(0)}ms
                    </div>
                    <div className="text-sm text-gray-600">Backend Processing</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cache Statistics */}
          {cacheStats && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Cache Statistics</h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearCache();
                  }}
                  disabled={isLoading}
                  className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Clearing...' : 'Clear Cache'}
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-xl font-bold text-green-600">
                    {cacheStats.hits.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600">Cache Hits</div>
                </div>

                <div className="bg-orange-50 rounded-lg p-3">
                  <div className="text-xl font-bold text-orange-600">
                    {cacheStats.misses.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600">Cache Misses</div>
                </div>

                <div className="bg-indigo-50 rounded-lg p-3">
                  <div className="text-xl font-bold text-indigo-600">
                    {cacheStats.size.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600">Cache Size</div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xl font-bold text-gray-600">
                    {cacheStats.evictions.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600">Evictions</div>
                </div>
              </div>

              {/* Hit Rate */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Cache Hit Rate</span>
                  <span className={`text-2xl font-bold ${getHitRateColor(cacheStats.hitRate)}`}>
                    {cacheStats.hitRate.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      cacheStats.hitRate >= 80 
                        ? 'bg-green-500' 
                        : cacheStats.hitRate >= 50 
                        ? 'bg-yellow-500' 
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${cacheStats.hitRate}%` }}
                  />
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  {cacheStats.hitRate >= 80 && '🎉 Excellent cache performance!'}
                  {cacheStats.hitRate >= 50 && cacheStats.hitRate < 80 && '👍 Good cache performance'}
                  {cacheStats.hitRate < 50 && '⚠️ Cache is warming up...'}
                </div>
              </div>

              {/* Performance Impact */}
              {cacheStats.hits > 0 && (
                <div className="bg-blue-50 rounded-lg p-4 mt-4">
                  <div className="text-sm font-medium text-blue-900 mb-1">
                    💡 Performance Impact
                  </div>
                  <div className="text-xs text-blue-700">
                    Cache saved approximately{' '}
                    <span className="font-bold">
                      {Math.round((cacheStats.hits * 100) / 1000)}
                    </span>{' '}
                    seconds of API wait time (estimated)
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
