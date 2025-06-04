import { Hono } from 'hono';
import { usageMonitor, getCostOptimizationInsights } from '../utils/usage-monitoring';
import { getRateLimitStats } from '../middleware/rate-limiting';
import { cfAccessAuth } from '../middleware/auth';
import type { AppContext } from '../types';

const adminRoutes = new Hono<AppContext>();

// Apply CF Access authentication to all admin routes
adminRoutes.use('*', cfAccessAuth);

// Cost optimization and usage monitoring endpoints
adminRoutes.get('/usage-report', async (c) => {
  try {
    const report = usageMonitor.generateUsageReport();

    return c.json({
      success: true,
      data: {
        ...report,
        generatedAt: new Date().toISOString(),
        complianceStatus: 'RFC-TREK-COST-001 Compliant',
        freeTierStatus: report.projectedUpgradeCost === 0 ? 'within_limits' : 'approaching_limits',
      },
    });
  } catch (error) {
    console.error('Usage report generation failed:', error);
    return c.json({ success: false, error: 'Failed to generate usage report' }, 500);
  }
});

adminRoutes.get('/cost-insights', async (c) => {
  try {
    const insights = getCostOptimizationInsights();

    return c.json({
      success: true,
      data: {
        ...insights,
        rfcCompliance: {
          rfc: 'RFC-TREK-COST-001',
          status: insights.status === 'within_free_tier' ? 'compliant' : 'needs_attention',
          principle: 'near-zero cost IT operations',
        },
      },
    });
  } catch (error) {
    console.error('Cost insights generation failed:', error);
    return c.json({ success: false, error: 'Failed to generate cost insights' }, 500);
  }
});

adminRoutes.get('/usage-alerts', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '20');
    const alerts = usageMonitor.getRecentAlerts(limit);

    return c.json({
      success: true,
      data: {
        alerts,
        summary: {
          total: alerts.length,
          critical: alerts.filter((a) => a.severity === 'critical').length,
          warning: alerts.filter((a) => a.severity === 'warning').length,
        },
      },
    });
  } catch (error) {
    console.error('Usage alerts retrieval failed:', error);
    return c.json({ success: false, error: 'Failed to retrieve usage alerts' }, 500);
  }
});

adminRoutes.post('/usage-cleanup', async (c) => {
  try {
    usageMonitor.cleanupOldMetrics();

    return c.json({
      success: true,
      message: 'Usage metrics cleanup completed',
      cleanupDate: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Usage cleanup failed:', error);
    return c.json({ success: false, error: 'Failed to cleanup usage metrics' }, 500);
  }
});

adminRoutes.get('/rate-limit-stats', async (c) => {
  try {
    const stats = getRateLimitStats();

    return c.json({
      success: true,
      data: {
        rateLimiting: stats,
        summary: {
          totalActiveKeys: stats.store.activeKeys,
          totalConfigs: Object.keys(stats.configs).length,
          configuredEndpoints: Object.keys(stats.configs),
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Rate limit stats retrieval failed:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to retrieve rate limit statistics',
      },
      500,
    );
  }
});

export default adminRoutes;
