import { Hono } from 'hono';
import { getSecurityHeadersConfig } from '../middleware/security-headers';
import type { AppContext } from '../types';

const testSecurityRoutes = new Hono<AppContext>();

/**
 * GET /headers
 * Test endpoint to verify security headers configuration
 * Returns current security headers configuration and verifies they're being applied
 */
testSecurityRoutes.get('/headers', (c) => {
  const headersConfig = getSecurityHeadersConfig();

  return c.json({
    success: true,
    data: {
      message: 'Security headers configuration and verification',
      securityHeaders: headersConfig,
      appliedHeaders: Object.keys(headersConfig).reduce(
        (acc, headerName) => {
          // Check if the header was actually applied to this response
          const headerValue = c.res.headers.get(headerName);
          acc[headerName] = {
            configured: headersConfig[headerName as keyof typeof headersConfig],
            applied: headerValue || 'Not yet applied (will be applied after response)',
          };
          return acc;
        },
        {} as Record<string, { configured: string; applied: string }>,
      ),
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * GET /csp-test
 * Test endpoint specifically for Content Security Policy verification
 * Useful for testing CSP compliance
 */
testSecurityRoutes.get('/csp-test', (c) => {
  return c.json({
    success: true,
    data: {
      message: 'CSP test endpoint',
      csp: 'Check the Content-Security-Policy header in this response',
      testInstructions: [
        'This endpoint should have a restrictive CSP',
        'Use browser dev tools to verify no CSP violations',
        'CSP should prevent inline scripts and external resources',
      ],
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * GET /security-audit
 * Comprehensive security configuration audit
 * Provides operational visibility into security settings
 */
testSecurityRoutes.get('/security-audit', (c) => {
  const headersConfig = getSecurityHeadersConfig();

  return c.json({
    success: true,
    data: {
      message: 'Security configuration audit',
      securityHeaders: {
        configured: headersConfig,
        count: Object.keys(headersConfig).length,
      },
      securityFeatures: {
        'MIME Type Sniffing Protection': 'X-Content-Type-Options: nosniff',
        'Clickjacking Protection': 'X-Frame-Options: DENY',
        'Referrer Policy': 'strict-origin-when-cross-origin',
        'Content Security Policy': 'Restrictive API-focused CSP',
        'HTTPS Enforcement (HSTS)': 'Commented out - enable when ready',
      },
      recommendations: [
        'Enable HSTS when HTTPS is fully deployed',
        'Monitor CSP violations if serving web content',
        'Consider additional security headers for specific use cases',
      ],
      compliance: {
        'OWASP Security Headers': 'Partially compliant',
        'RFC-TREK-SEC-HEADERS-001': 'Fully compliant',
      },
      timestamp: new Date().toISOString(),
    },
  });
});

export default testSecurityRoutes;
