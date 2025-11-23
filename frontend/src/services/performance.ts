/**
 * Performance Measurement Service
 * 
 * Provides industry-standard performance measurement using Browser Performance API
 * (User Timing API and Performance Observer)
 */

export interface PerformanceMetrics {
  totalDuration: number; // Total time from user action to completion (ms)
  networkDuration: number; // Network request time (ms)
  backendDuration: number; // Backend processing time (ms)
  frontendDuration?: number; // Frontend processing time (ms)
}

export interface PerformanceMeasure {
  name: string;
  duration: number;
  startTime: number;
  entryType: string;
}

class PerformanceService {
  private observer: PerformanceObserver | null = null;
  private measures: PerformanceMeasure[] = [];

  constructor() {
    this.initializeObserver();
  }

  /**
   * Initialize Performance Observer to automatically collect metrics
   */
  private initializeObserver(): void {
    if (typeof PerformanceObserver === 'undefined') {
      console.warn('PerformanceObserver is not supported in this browser');
      return;
    }

    try {
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'measure') {
            this.measures.push({
              name: entry.name,
              duration: entry.duration,
              startTime: entry.startTime,
              entryType: entry.entryType,
            });
          }
        });
      });

      // Observe measure entries
      this.observer.observe({ entryTypes: ['measure'] });
    } catch (error) {
      console.warn('Failed to initialize Performance Observer:', error);
    }
  }

  /**
   * Create a performance mark for the start of an operation
   */
  markStart(name: string): void {
    if (typeof performance !== 'undefined' && performance.mark) {
      try {
        performance.mark(`${name}-start`);
      } catch (error) {
        console.warn(`Failed to create start mark for ${name}:`, error);
      }
    }
  }

  /**
   * Create a performance mark for the end of an operation
   */
  markEnd(name: string): void {
    if (typeof performance !== 'undefined' && performance.mark) {
      try {
        performance.mark(`${name}-end`);
      } catch (error) {
        console.warn(`Failed to create end mark for ${name}:`, error);
      }
    }
  }

  /**
   * Create a performance measure between two marks
   */
  measure(name: string, startMark: string, endMark: string): number | null {
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        performance.measure(name, `${startMark}-start`, `${endMark}-end`);
        
        // Get the measure entry
        const measureEntries = performance.getEntriesByName(name, 'measure');
        if (measureEntries.length > 0) {
          return measureEntries[measureEntries.length - 1].duration;
        }
      } catch (error) {
        console.warn(`Failed to create measure for ${name}:`, error);
      }
    }
    return null;
  }

  /**
   * Get a specific measure by name
   */
  getMeasure(name: string): PerformanceMeasure | null {
    if (typeof performance !== 'undefined') {
      const entries = performance.getEntriesByName(name, 'measure');
      if (entries.length > 0) {
        const entry = entries[entries.length - 1];
        return {
          name: entry.name,
          duration: entry.duration,
          startTime: entry.startTime,
          entryType: entry.entryType,
        };
      }
    }
    return null;
  }

  /**
   * Retrieve all performance measurements
   */
  getMeasurements(): PerformanceMeasure[] {
    if (typeof performance !== 'undefined') {
      const entries = performance.getEntriesByType('measure');
      return entries.map((entry) => ({
        name: entry.name,
        duration: entry.duration,
        startTime: entry.startTime,
        entryType: entry.entryType,
      }));
    }
    return this.measures;
  }

  /**
   * Clear all marks and measures (for memory management)
   */
  clearMarks(markName?: string): void {
    if (typeof performance !== 'undefined' && performance.clearMarks) {
      try {
        if (markName) {
          performance.clearMarks(`${markName}-start`);
          performance.clearMarks(`${markName}-end`);
        } else {
          performance.clearMarks();
        }
      } catch (error) {
        console.warn('Failed to clear marks:', error);
      }
    }
  }

  /**
   * Clear all measures
   */
  clearMeasures(measureName?: string): void {
    if (typeof performance !== 'undefined' && performance.clearMeasures) {
      try {
        if (measureName) {
          performance.clearMeasures(measureName);
        } else {
          performance.clearMeasures();
        }
        this.measures = [];
      } catch (error) {
        console.warn('Failed to clear measures:', error);
      }
    }
  }

  /**
   * Get network timing information from a resource entry
   */
  getNetworkTiming(resourceName: string): {
    duration: number;
    dns: number;
    connect: number;
    request: number;
    response: number;
  } | null {
    if (typeof performance !== 'undefined') {
      const entries = performance.getEntriesByName(resourceName, 'resource');
      if (entries.length > 0) {
        const entry = entries[entries.length - 1] as PerformanceResourceTiming;
        return {
          duration: entry.duration,
          dns: entry.domainLookupEnd - entry.domainLookupStart,
          connect: entry.connectEnd - entry.connectStart,
          request: entry.responseStart - entry.requestStart,
          response: entry.responseEnd - entry.responseStart,
        };
      }
    }
    return null;
  }

  /**
   * Disconnect the observer (cleanup)
   */
  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Export singleton instance
export const performanceService = new PerformanceService();


