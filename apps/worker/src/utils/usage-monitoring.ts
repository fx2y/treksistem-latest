/**
 * Usage Monitoring Utility for Treksistem
 *
 * Tracks Cloudflare service usage to ensure free tier compliance
 * and provide cost optimization insights per RFC-TREK-COST-001
 */

import { createId } from '@paralleldrive/cuid2';

export interface UsageMetrics {
  timestamp: number;
  workerRequests: number;
  d1RowsRead: number;
  d1RowsWritten: number;
  r2ClassAOps: number;
  r2ClassBOps: number;
  r2StorageBytes: number;
  cpuTimeMs: number;
}

export interface UsageAlert {
  id: string;
  timestamp: number;
  service: 'workers' | 'd1' | 'r2' | 'pages' | 'access';
  metric: string;
  currentValue: number;
  threshold: number;
  severity: 'warning' | 'critical';
  message: string;
}

export interface CostOptimizationRecommendation {
  id: string;
  category: 'query_optimization' | 'caching' | 'storage' | 'request_reduction';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  estimatedSavings: string;
  implementation: string;
}

/**
 * Free tier limits for Cloudflare services
 */
export const FREE_TIER_LIMITS = {
  workers: {
    requestsPerDay: 100000,
    cpuTimePerRequest: 10, // ms
  },
  d1: {
    rowsReadPerDay: 5000000,
    rowsWrittenPerDay: 100000,
    storageBytes: 5 * 1024 * 1024 * 1024, // 5GB
  },
  r2: {
    storageBytes: 10 * 1024 * 1024 * 1024, // 10GB
    classAOpsPerMonth: 1000000,
    classBOpsPerMonth: 10000000,
  },
  pages: {
    buildsPerMonth: 500,
    bandwidthPerMonth: 100 * 1024 * 1024 * 1024, // 100GB
  },
  access: {
    users: 50,
  },
} as const;

/**
 * Alert thresholds (80% of free tier limits)
 */
export const ALERT_THRESHOLDS = {
  workers: {
    requestsPerDay: FREE_TIER_LIMITS.workers.requestsPerDay * 0.8,
  },
  d1: {
    rowsReadPerDay: FREE_TIER_LIMITS.d1.rowsReadPerDay * 0.8,
    rowsWrittenPerDay: FREE_TIER_LIMITS.d1.rowsWrittenPerDay * 0.8,
    storageBytes: FREE_TIER_LIMITS.d1.storageBytes * 0.8,
  },
  r2: {
    storageBytes: FREE_TIER_LIMITS.r2.storageBytes * 0.8,
    classAOpsPerMonth: FREE_TIER_LIMITS.r2.classAOpsPerMonth * 0.8,
    classBOpsPerMonth: FREE_TIER_LIMITS.r2.classBOpsPerMonth * 0.8,
  },
} as const;

export class UsageMonitor {
  private metrics: UsageMetrics[] = [];
  private alerts: UsageAlert[] = [];

  /**
   * Track a Worker request
   */
  trackWorkerRequest(cpuTimeMs: number = 1): void {
    console.log(`USAGE_METRIC: worker_request=1 cpu_time_ms=${cpuTimeMs}`);

    // Update current metrics
    const currentMetrics = this.getCurrentMetrics();
    currentMetrics.workerRequests += 1;
    currentMetrics.cpuTimeMs += cpuTimeMs;

    this.checkWorkerLimits(currentMetrics);
  }

  /**
   * Track D1 database operations
   */
  trackD1Operation(operation: 'read' | 'write', rowCount: number, queryMeta?: any): void {
    console.log(`USAGE_METRIC: d1_${operation}=${rowCount}`);

    const currentMetrics = this.getCurrentMetrics();

    if (operation === 'read') {
      currentMetrics.d1RowsRead += rowCount;
    } else {
      currentMetrics.d1RowsWritten += rowCount;
    }

    // Log query performance if meta available
    if (queryMeta) {
      const duration = queryMeta.duration || 0;
      console.log(`USAGE_METRIC: d1_query_duration_ms=${duration}`);

      if (duration > 100) {
        console.warn(`SLOW_QUERY: D1 query took ${duration}ms - consider optimization`);
      }
    }

    this.checkD1Limits(currentMetrics);
  }

  /**
   * Track R2 storage operations
   */
  trackR2Operation(operation: 'put' | 'get' | 'delete', sizeBytes?: number): void {
    const currentMetrics = this.getCurrentMetrics();

    if (operation === 'put' || operation === 'delete') {
      currentMetrics.r2ClassAOps += 1;
      console.log(`USAGE_METRIC: r2_class_a_ops=1`);
    } else {
      currentMetrics.r2ClassBOps += 1;
      console.log(`USAGE_METRIC: r2_class_b_ops=1`);
    }

    if (sizeBytes) {
      if (operation === 'put') {
        currentMetrics.r2StorageBytes += sizeBytes;
      } else if (operation === 'delete') {
        currentMetrics.r2StorageBytes = Math.max(0, currentMetrics.r2StorageBytes - sizeBytes);
      }
      console.log(`USAGE_METRIC: r2_storage_bytes=${currentMetrics.r2StorageBytes}`);
    }

    this.checkR2Limits(currentMetrics);
  }

  /**
   * Get current metrics for the day
   */
  private getCurrentMetrics(): UsageMetrics {
    const today = new Date().toDateString();
    let todayMetrics = this.metrics.find((m) => new Date(m.timestamp).toDateString() === today);

    if (!todayMetrics) {
      todayMetrics = {
        timestamp: Date.now(),
        workerRequests: 0,
        d1RowsRead: 0,
        d1RowsWritten: 0,
        r2ClassAOps: 0,
        r2ClassBOps: 0,
        r2StorageBytes: 0,
        cpuTimeMs: 0,
      };
      this.metrics.push(todayMetrics);
    }

    return todayMetrics;
  }

  /**
   * Check Worker usage against limits
   */
  private checkWorkerLimits(metrics: UsageMetrics): void {
    if (metrics.workerRequests >= ALERT_THRESHOLDS.workers.requestsPerDay) {
      this.createAlert(
        'workers',
        'requests_per_day',
        metrics.workerRequests,
        FREE_TIER_LIMITS.workers.requestsPerDay,
        'warning',
        `Worker requests approaching daily limit: ${metrics.workerRequests}/${FREE_TIER_LIMITS.workers.requestsPerDay}`,
      );
    }
  }

  /**
   * Check D1 usage against limits
   */
  private checkD1Limits(metrics: UsageMetrics): void {
    if (metrics.d1RowsRead >= ALERT_THRESHOLDS.d1.rowsReadPerDay) {
      this.createAlert(
        'd1',
        'rows_read_per_day',
        metrics.d1RowsRead,
        FREE_TIER_LIMITS.d1.rowsReadPerDay,
        'warning',
        `D1 row reads approaching daily limit: ${metrics.d1RowsRead}/${FREE_TIER_LIMITS.d1.rowsReadPerDay}`,
      );
    }

    if (metrics.d1RowsWritten >= ALERT_THRESHOLDS.d1.rowsWrittenPerDay) {
      this.createAlert(
        'd1',
        'rows_written_per_day',
        metrics.d1RowsWritten,
        FREE_TIER_LIMITS.d1.rowsWrittenPerDay,
        'warning',
        `D1 row writes approaching daily limit: ${metrics.d1RowsWritten}/${FREE_TIER_LIMITS.d1.rowsWrittenPerDay}`,
      );
    }
  }

  /**
   * Check R2 usage against limits
   */
  private checkR2Limits(metrics: UsageMetrics): void {
    if (metrics.r2StorageBytes >= ALERT_THRESHOLDS.r2.storageBytes) {
      this.createAlert(
        'r2',
        'storage_bytes',
        metrics.r2StorageBytes,
        FREE_TIER_LIMITS.r2.storageBytes,
        'warning',
        `R2 storage approaching limit: ${(metrics.r2StorageBytes / 1024 ** 3).toFixed(2)}GB/${(FREE_TIER_LIMITS.r2.storageBytes / 1024 ** 3).toFixed(0)}GB`,
      );
    }
  }

  /**
   * Create a usage alert
   */
  private createAlert(
    service: UsageAlert['service'],
    metric: string,
    currentValue: number,
    threshold: number,
    severity: UsageAlert['severity'],
    message: string,
  ): void {
    const alert: UsageAlert = {
      id: createId(),
      timestamp: Date.now(),
      service,
      metric,
      currentValue,
      threshold,
      severity,
      message,
    };

    this.alerts.push(alert);
    console.warn(`USAGE_ALERT: ${alert.message}`);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }

  /**
   * Get cost optimization recommendations based on usage patterns
   */
  getCostOptimizationRecommendations(): CostOptimizationRecommendation[] {
    const recommendations: CostOptimizationRecommendation[] = [];
    const currentMetrics = this.getCurrentMetrics();

    // High D1 read usage
    if (currentMetrics.d1RowsRead > FREE_TIER_LIMITS.d1.rowsReadPerDay * 0.5) {
      recommendations.push({
        id: createId(),
        category: 'query_optimization',
        priority: 'high',
        title: 'Optimize Database Queries',
        description:
          'High D1 row read usage detected. Consider adding indexes, optimizing queries, or implementing more aggressive caching.',
        estimatedSavings: '20-40% reduction in D1 reads',
        implementation:
          'Review slow queries, add strategic indexes, implement TanStack Query with longer stale times',
      });
    }

    // High Worker request volume
    if (currentMetrics.workerRequests > FREE_TIER_LIMITS.workers.requestsPerDay * 0.6) {
      recommendations.push({
        id: createId(),
        category: 'caching',
        priority: 'medium',
        title: 'Implement Aggressive Caching',
        description:
          'High Worker request volume. Implement longer cache times for static data and reduce polling frequency.',
        estimatedSavings: '30-50% reduction in Worker requests',
        implementation:
          'Increase TanStack Query staleTime, implement service worker caching, reduce polling intervals',
      });
    }

    // R2 storage growing
    if (currentMetrics.r2StorageBytes > FREE_TIER_LIMITS.r2.storageBytes * 0.3) {
      recommendations.push({
        id: createId(),
        category: 'storage',
        priority: 'medium',
        title: 'Implement Image Compression',
        description:
          'R2 storage usage growing. Implement client-side image compression before upload.',
        estimatedSavings: '60-80% reduction in storage usage',
        implementation:
          'Add image compression in driver app before R2 upload, implement progressive JPEG',
      });
    }

    // General optimization
    recommendations.push({
      id: createId(),
      category: 'request_reduction',
      priority: 'low',
      title: 'Optimize Polling Patterns',
      description:
        'Review polling intervals across all frontends to balance real-time updates with request efficiency.',
      estimatedSavings: '10-20% reduction in Worker requests',
      implementation:
        'Implement exponential backoff for polling, use WebSockets for real-time updates when needed',
    });

    return recommendations;
  }

  /**
   * Generate usage report
   */
  generateUsageReport(): {
    currentUsage: UsageMetrics;
    utilizationPercentages: Record<string, number>;
    alerts: UsageAlert[];
    recommendations: CostOptimizationRecommendation[];
    projectedUpgradeCost: number;
  } {
    const currentMetrics = this.getCurrentMetrics();

    const utilizationPercentages = {
      workerRequests:
        (currentMetrics.workerRequests / FREE_TIER_LIMITS.workers.requestsPerDay) * 100,
      d1RowsRead: (currentMetrics.d1RowsRead / FREE_TIER_LIMITS.d1.rowsReadPerDay) * 100,
      d1RowsWritten: (currentMetrics.d1RowsWritten / FREE_TIER_LIMITS.d1.rowsWrittenPerDay) * 100,
      r2Storage: (currentMetrics.r2StorageBytes / FREE_TIER_LIMITS.r2.storageBytes) * 100,
    };

    // Calculate projected upgrade cost (Workers Paid plan is $5/month)
    const needsUpgrade = Object.values(utilizationPercentages).some((pct) => pct > 80);
    const projectedUpgradeCost = needsUpgrade ? 5 : 0; // $5/month for Workers Paid

    return {
      currentUsage: currentMetrics,
      utilizationPercentages,
      alerts: this.alerts.slice(-10), // Last 10 alerts
      recommendations: this.getCostOptimizationRecommendations(),
      projectedUpgradeCost,
    };
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit: number = 10): UsageAlert[] {
    return this.alerts.slice(-limit);
  }

  /**
   * Clear old metrics (keep last 30 days)
   */
  cleanupOldMetrics(): void {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    this.metrics = this.metrics.filter((m) => m.timestamp > thirtyDaysAgo);
    this.alerts = this.alerts.filter((a) => a.timestamp > thirtyDaysAgo);
  }
}

/**
 * Global usage monitor instance
 */
export const usageMonitor = new UsageMonitor();

/**
 * Middleware to track Worker requests
 */
export const usageTrackingMiddleware = async (c: any, next: any) => {
  const startTime = Date.now();

  await next();

  const cpuTime = Date.now() - startTime;
  usageMonitor.trackWorkerRequest(cpuTime);
};

/**
 * Helper to track D1 query results
 */
export const trackD1QueryResult = (result: any, operation: 'read' | 'write' = 'read') => {
  let rowCount = 0;

  if (result && typeof result === 'object') {
    // Handle different Drizzle result types
    if (Array.isArray(result)) {
      rowCount = result.length;
    } else if (result.meta && typeof result.meta.rows_read === 'number') {
      rowCount = result.meta.rows_read;
    } else if (result.meta && typeof result.meta.rows_written === 'number') {
      rowCount = result.meta.rows_written;
      operation = 'write';
    } else if (result.changes) {
      rowCount = result.changes;
      operation = 'write';
    } else {
      rowCount = 1; // Default for single operations
    }
  }

  usageMonitor.trackD1Operation(operation, rowCount, result?.meta);
  return result;
};

/**
 * Helper to track R2 operations
 */
export const trackR2Upload = (key: string, sizeBytes: number) => {
  usageMonitor.trackR2Operation('put', sizeBytes);
  console.log(`R2_UPLOAD: key=${key} size=${sizeBytes} bytes`);
};

export const trackR2Download = (key: string) => {
  usageMonitor.trackR2Operation('get');
  console.log(`R2_DOWNLOAD: key=${key}`);
};

/**
 * Cost optimization insights
 */
export const getCostOptimizationInsights = () => {
  const report = usageMonitor.generateUsageReport();

  return {
    status: report.projectedUpgradeCost > 0 ? 'upgrade_recommended' : 'within_free_tier',
    monthlyProjectedCost: report.projectedUpgradeCost,
    topRecommendations: report.recommendations.slice(0, 3),
    criticalAlerts: report.alerts.filter((a) => a.severity === 'critical'),
    utilizationSummary: report.utilizationPercentages,
  };
};
