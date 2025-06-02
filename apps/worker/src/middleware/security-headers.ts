import type { Context, Next } from 'hono';
import type { AppContext } from '../types';

/**
 * Security Headers Configuration
 * Centralized configuration for all security headers
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Content Security Policy - Restrictive for API endpoints
  // Allows self resources, denies frames, restricts form actions
  'Content-Security-Policy': "default-src 'self'; frame-ancestors 'none'; form-action 'self'; object-src 'none'; script-src 'none'; style-src 'none'; img-src 'self';",
  // Strict Transport Security - Enable HTTPS enforcement
  // Note: Only enable when ready for full HTTPS commitment
  // 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
} as const;

/**
 * Security Headers Middleware
 * Applies standard security headers to all responses for enhanced application security
 * 
 * Headers applied:
 * - X-Content-Type-Options: Prevents MIME type sniffing
 * - X-Frame-Options: Prevents clickjacking by denying iframe embedding
 * - Referrer-Policy: Controls referrer information sent with requests
 * - Content-Security-Policy: Restricts resource loading for XSS protection
 * 
 * Based on RFC-TREK-SEC-HEADERS-001 specification
 */
export const securityHeaders = () => {
  return async (c: Context<AppContext>, next: Next) => {
    await next(); // Apply headers after the route handler has potentially set its own
    
    // Apply all security headers
    Object.entries(SECURITY_HEADERS).forEach(([name, value]) => {
      c.header(name, value);
    });
  };
};

/**
 * Get current security headers configuration
 * Useful for testing and configuration verification
 */
export const getSecurityHeadersConfig = () => SECURITY_HEADERS;

/**
 * Enable HSTS (Strict Transport Security)
 * Only call this when ready for full HTTPS enforcement
 * 
 * @param maxAge - Max age in seconds (default: 1 year)
 * @param includeSubDomains - Include subdomains (default: true)
 * @param preload - Enable HSTS preload (default: false)
 */
export const enableHSTS = (
  maxAge: number = 31536000, // 1 year
  includeSubDomains: boolean = true,
  preload: boolean = false
): string => {
  let hstsValue = `max-age=${maxAge}`;
  if (includeSubDomains) hstsValue += '; includeSubDomains';
  if (preload) hstsValue += '; preload';
  
  return hstsValue;
}; 