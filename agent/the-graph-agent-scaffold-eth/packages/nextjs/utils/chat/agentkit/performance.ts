// Performance monitoring utility for tool calls

interface PerformanceMetric {
  toolName: string;
  duration: number;
  timestamp: number;
  success: boolean;
  error?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 100; // Keep last 100 metrics

  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);

    // Keep only the last maxMetrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow operations in development
    if (process.env.NODE_ENV === "development" && metric.duration > 5000) {
      console.warn(`⚠️  Slow tool call: ${metric.toolName} took ${metric.duration}ms`);
    }
  }

  getAverageDuration(toolName?: string): number {
    const filtered = toolName ? this.metrics.filter(m => m.toolName === toolName) : this.metrics;

    if (filtered.length === 0) return 0;

    const total = filtered.reduce((sum, m) => sum + m.duration, 0);
    return total / filtered.length;
  }

  getMetrics(toolName?: string): PerformanceMetric[] {
    return toolName ? this.metrics.filter(m => m.toolName === toolName) : this.metrics;
  }

  clear() {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Decorator to measure performance of async functions
export function measurePerformance(toolName: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      let success = true;
      let error: string | undefined;

      try {
        const result = await method.apply(this, args);
        return result;
      } catch (err) {
        success = false;
        error = err instanceof Error ? err.message : "Unknown error";
        throw err;
      } finally {
        const duration = Date.now() - startTime;
        performanceMonitor.recordMetric({
          toolName,
          duration,
          timestamp: Date.now(),
          success,
          error,
        });
      }
    };

    return descriptor;
  };
}

// Utility function to wrap async functions with performance monitoring
export function withPerformanceMonitoring<T extends any[], R>(
  toolName: string,
  fn: (...args: T) => Promise<R>,
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    let success = true;
    let error: string | undefined;

    try {
      const result = await fn(...args);
      return result;
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : "Unknown error";
      throw err;
    } finally {
      const duration = Date.now() - startTime;
      performanceMonitor.recordMetric({
        toolName,
        duration,
        timestamp: Date.now(),
        success,
        error,
      });
    }
  };
}
