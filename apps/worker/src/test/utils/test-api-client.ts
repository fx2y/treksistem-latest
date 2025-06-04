/**
 * Test API Client for Integration Testing
 *
 * Provides a clean interface for making HTTP requests to the worker API
 * with proper authentication headers and response parsing.
 */
export class TestApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  /**
   * Make a GET request
   */
  async get(path: string, headers: Record<string, string> = {}) {
    return this.makeRequest('GET', path, null, headers);
  }

  /**
   * Make a POST request
   */
  async post(path: string, body: any, headers: Record<string, string> = {}) {
    return this.makeRequest('POST', path, body, headers);
  }

  /**
   * Make a PUT request
   */
  async put(path: string, body: any, headers: Record<string, string> = {}) {
    return this.makeRequest('PUT', path, body, headers);
  }

  /**
   * Make a DELETE request
   */
  async delete(path: string, headers: Record<string, string> = {}) {
    return this.makeRequest('DELETE', path, null, headers);
  }

  /**
   * Make a PATCH request
   */
  async patch(path: string, body: any, headers: Record<string, string> = {}) {
    return this.makeRequest('PATCH', path, body, headers);
  }

  /**
   * Core request method
   */
  private async makeRequest(
    method: string,
    path: string,
    body: any,
    headers: Record<string, string>,
  ) {
    const url = `${this.baseUrl}${path}`;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    const requestInit: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body && method !== 'GET' && method !== 'DELETE') {
      requestInit.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, requestInit);

      let responseBody: any = {};
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        try {
          responseBody = await response.json();
        } catch (parseError) {
          // If JSON parsing fails, leave body empty
          responseBody = {};
        }
      } else {
        // For non-JSON responses, get text
        const text = await response.text();
        if (text) {
          responseBody = { text };
        }
      }

      return {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseBody,
        ok: response.ok,
      };
    } catch (error) {
      throw new Error(
        `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Helper method to create authenticated headers for Mitra users
   */
  createMitraAuthHeaders(email: string): Record<string, string> {
    return {
      'Cf-Access-Authenticated-User-Email': email,
    };
  }

  /**
   * Helper method to create authenticated headers for Driver users
   */
  createDriverAuthHeaders(driverId: string): Record<string, string> {
    return {
      'X-Driver-Id': driverId,
    };
  }

  /**
   * Convenience method for making authenticated Mitra requests
   */
  async mitraRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    path: string,
    email: string,
    body?: any,
  ) {
    const headers = this.createMitraAuthHeaders(email);

    switch (method) {
      case 'GET':
        return this.get(path, headers);
      case 'POST':
        return this.post(path, body, headers);
      case 'PUT':
        return this.put(path, body, headers);
      case 'DELETE':
        return this.delete(path, headers);
      case 'PATCH':
        return this.patch(path, body, headers);
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  }

  /**
   * Convenience method for making authenticated Driver requests
   */
  async driverRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    path: string,
    driverId: string,
    body?: any,
  ) {
    const headers = this.createDriverAuthHeaders(driverId);

    switch (method) {
      case 'GET':
        return this.get(path, headers);
      case 'POST':
        return this.post(path, body, headers);
      case 'PUT':
        return this.put(path, body, headers);
      case 'DELETE':
        return this.delete(path, headers);
      case 'PATCH':
        return this.patch(path, body, headers);
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  }

  /**
   * Health check method
   */
  async healthCheck() {
    return this.get('/api/health');
  }

  /**
   * Wait for the API to be ready
   */
  async waitForReady(maxAttempts: number = 30, delayMs: number = 1000): Promise<boolean> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await this.healthCheck();
        if (response.ok) {
          return true;
        }
      } catch (error) {
        // Ignore errors and continue trying
      }

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return false;
  }
}
