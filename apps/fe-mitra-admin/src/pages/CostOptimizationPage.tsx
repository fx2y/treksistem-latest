import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Database, 
  HardDrive, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface UsageMetrics {
  timestamp: number;
  workerRequests: number;
  d1RowsRead: number;
  d1RowsWritten: number;
  r2ClassAOps: number;
  r2ClassBOps: number;
  r2StorageBytes: number;
  cpuTimeMs: number;
}

interface UsageAlert {
  id: string;
  timestamp: number;
  service: 'workers' | 'd1' | 'r2' | 'pages' | 'access';
  metric: string;
  currentValue: number;
  threshold: number;
  severity: 'warning' | 'critical';
  message: string;
}

interface CostOptimizationRecommendation {
  id: string;
  category: 'query_optimization' | 'caching' | 'storage' | 'request_reduction';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  estimatedSavings: string;
  implementation: string;
}

interface UsageReport {
  currentUsage: UsageMetrics;
  utilizationPercentages: Record<string, number>;
  alerts: UsageAlert[];
  recommendations: CostOptimizationRecommendation[];
  projectedUpgradeCost: number;
  generatedAt: string;
  complianceStatus: string;
  freeTierStatus: 'within_limits' | 'approaching_limits';
}

interface CostInsights {
  status: 'within_free_tier' | 'upgrade_recommended';
  monthlyProjectedCost: number;
  topRecommendations: CostOptimizationRecommendation[];
  criticalAlerts: UsageAlert[];
  utilizationSummary: Record<string, number>;
  rfcCompliance: {
    rfc: string;
    status: 'compliant' | 'needs_attention';
    principle: string;
  };
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat().format(num);
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'destructive';
    case 'medium': return 'default';
    case 'low': return 'secondary';
    default: return 'default';
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'destructive';
    case 'warning': return 'default';
    default: return 'secondary';
  }
};

export default function CostOptimizationPage() {
  const queryClient = useQueryClient();

  // Fetch usage report
  const { data: usageReport, isLoading: isLoadingReport, error: reportError } = useQuery<{
    success: boolean;
    data: UsageReport;
  }>({
    queryKey: ['usage-report'],
    queryFn: async () => {
      const response = await fetch('/api/admin/usage-report');
      if (!response.ok) {
        throw new Error('Failed to fetch usage report');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch cost insights
  const { data: costInsights, isLoading: isLoadingInsights } = useQuery<{
    success: boolean;
    data: CostInsights;
  }>({
    queryKey: ['cost-insights'],
    queryFn: async () => {
      const response = await fetch('/api/admin/cost-insights');
      if (!response.ok) {
        throw new Error('Failed to fetch cost insights');
      }
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Cleanup mutation
  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/usage-cleanup', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to cleanup usage metrics');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Usage metrics cleanup completed');
      queryClient.invalidateQueries({ queryKey: ['usage-report'] });
    },
    onError: () => {
      toast.error('Failed to cleanup usage metrics');
    },
  });

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['usage-report'] });
    queryClient.invalidateQueries({ queryKey: ['cost-insights'] });
    toast.success('Data refreshed');
  };

  if (isLoadingReport || isLoadingInsights) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading cost optimization data...</span>
        </div>
      </div>
    );
  }

  if (reportError) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load cost optimization data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const report = usageReport?.data;
  const insights = costInsights?.data;

  if (!report || !insights) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cost Optimization Dashboard</h1>
          <p className="text-muted-foreground">
            RFC-TREK-COST-001 Compliance Monitoring
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={() => cleanupMutation.mutate()} 
            variant="outline" 
            size="sm"
            disabled={cleanupMutation.isPending}
          >
            <Database className="h-4 w-4 mr-2" />
            Cleanup
          </Button>
        </div>
      </div>

      {/* RFC Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {insights.rfcCompliance.status === 'compliant' ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            )}
            RFC-TREK-COST-001 Compliance
          </CardTitle>
          <CardDescription>
            {insights.rfcCompliance.principle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Badge 
                variant={insights.rfcCompliance.status === 'compliant' ? 'default' : 'destructive'}
              >
                {insights.rfcCompliance.status.toUpperCase()}
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">
                Status: {report.freeTierStatus === 'within_limits' ? 'Within Free Tier Limits' : 'Approaching Limits'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                ${insights.monthlyProjectedCost}
              </div>
              <p className="text-sm text-muted-foreground">
                Projected Monthly Cost
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage Details</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Usage Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Worker Requests</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(report.currentUsage.workerRequests)}
                </div>
                <Progress 
                  value={report.utilizationPercentages.workerRequests} 
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {report.utilizationPercentages.workerRequests.toFixed(1)}% of daily limit
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">D1 Reads</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(report.currentUsage.d1RowsRead)}
                </div>
                <Progress 
                  value={report.utilizationPercentages.d1RowsRead} 
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {report.utilizationPercentages.d1RowsRead.toFixed(1)}% of daily limit
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">D1 Writes</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(report.currentUsage.d1RowsWritten)}
                </div>
                <Progress 
                  value={report.utilizationPercentages.d1RowsWritten} 
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {report.utilizationPercentages.d1RowsWritten.toFixed(1)}% of daily limit
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">R2 Storage</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatBytes(report.currentUsage.r2StorageBytes)}
                </div>
                <Progress 
                  value={report.utilizationPercentages.r2Storage} 
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {report.utilizationPercentages.r2Storage.toFixed(1)}% of storage limit
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Critical Alerts */}
          {insights.criticalAlerts.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Critical Alerts</AlertTitle>
              <AlertDescription>
                {insights.criticalAlerts.length} critical alert(s) require immediate attention.
              </AlertDescription>
            </Alert>
          )}

          {/* Top Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Top Optimization Recommendations</CardTitle>
              <CardDescription>
                Immediate actions to improve cost efficiency
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.topRecommendations.slice(0, 3).map((rec) => (
                  <div key={rec.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{rec.title}</h4>
                      <Badge variant={getPriorityColor(rec.priority) as any}>
                        {rec.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {rec.description}
                    </p>
                    <div className="text-sm">
                      <strong>Estimated Savings:</strong> {rec.estimatedSavings}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Usage Metrics</CardTitle>
              <CardDescription>
                Current usage across all Cloudflare services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">Cloudflare Workers</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Requests Today: {formatNumber(report.currentUsage.workerRequests)}</div>
                    <div>CPU Time: {report.currentUsage.cpuTimeMs}ms</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Cloudflare D1</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Rows Read: {formatNumber(report.currentUsage.d1RowsRead)}</div>
                    <div>Rows Written: {formatNumber(report.currentUsage.d1RowsWritten)}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Cloudflare R2</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>Storage: {formatBytes(report.currentUsage.r2StorageBytes)}</div>
                    <div>Class A Ops: {formatNumber(report.currentUsage.r2ClassAOps)}</div>
                    <div>Class B Ops: {formatNumber(report.currentUsage.r2ClassBOps)}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage Alerts</CardTitle>
              <CardDescription>
                Monitoring alerts for free tier compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {report.alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">No alerts - all systems operating within limits</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {report.alerts.map((alert) => (
                    <Alert key={alert.id} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle className="flex items-center justify-between">
                        {alert.service.toUpperCase()} - {alert.metric}
                        <Badge variant={getSeverityColor(alert.severity) as any}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                      </AlertTitle>
                      <AlertDescription>
                        {alert.message}
                        <div className="text-xs mt-1">
                          {new Date(alert.timestamp).toLocaleString()}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Optimization Recommendations</CardTitle>
              <CardDescription>
                Actionable insights to maintain free tier compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {report.recommendations.map((rec) => (
                  <div key={rec.id} className="border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">{rec.title}</h3>
                      <Badge variant={getPriorityColor(rec.priority) as any}>
                        {rec.priority.toUpperCase()} PRIORITY
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm">Description</h4>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm">Estimated Savings</h4>
                        <p className="text-sm text-green-600">{rec.estimatedSavings}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm">Implementation</h4>
                        <p className="text-sm text-muted-foreground">{rec.implementation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 