/**
 * Centralized HTTP Client
 * Unified fetch wrapper with retries, timeouts, and error handling
 */

import { getLogger } from '@weaveai/shared';
import {
  calculateBackoffDelay,
  isRetryableError,
  DEFAULT_RETRY_CONFIG,
  type RetryConfig,
} from './retry-strategy.js';

/**
 * HTTP client configuration
 */
export interface HTTPClientConfig {
  timeout?: number;
  retryConfig?: Partial<RetryConfig>;
  headers?: Record<string, string>;
  logging?: boolean;
}

/**
 * HTTP request options
 */
export interface HTTPRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  signal?: AbortSignal;
}

/**
 * HTTP response wrapper
 */
export interface HTTPResponse<T> {
  status: number;
  statusText: string;
  data: T;
  headers: Record<string, string>;
}

/**
 * HTTP error with context
 */
export class HTTPError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public url: string,
    message?: string
  ) {
    super(message || `HTTP ${status}: ${statusText}`);
    this.name = 'HTTPError';
  }
}

/**
 * Centralized HTTP Client
 */
export class HTTPClient {
  private readonly config: Required<HTTPClientConfig>;
  private readonly logger = getLogger();

  constructor(config: HTTPClientConfig = {}) {
    this.config = {
      timeout: config.timeout ?? 30000,
      retryConfig: { ...DEFAULT_RETRY_CONFIG, ...config.retryConfig },
      headers: config.headers ?? {},
      logging: config.logging ?? false,
    };
  }

  /**
   * Perform HTTP request with retries
   */
  async request<T = unknown>(
    url: string,
    options: HTTPRequestOptions = {}
  ): Promise<HTTPResponse<T>> {
    let attempt = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        return await this.performRequest<T>(url, options, attempt);
      } catch (error) {
        attempt++;

        if (attempt <= (this.config.retryConfig?.maxRetries ?? 3) && isRetryableError(error)) {
          const delay = calculateBackoffDelay(attempt - 1, this.config.retryConfig);
          this.logger.debug(`Retrying request after ${delay}ms`, { url, attempt });
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Perform single HTTP request
   */
  private async performRequest<T>(
    url: string,
    options: HTTPRequestOptions,
    attempt: number
  ): Promise<HTTPResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout ?? this.config.timeout);

    try {
      const headers = {
        ...this.config.headers,
        ...options.headers,
        'Content-Type': 'application/json',
      };

      const fetchOptions: RequestInit = {
        method: options.method ?? 'GET',
        headers,
        signal: options.signal ?? controller.signal,
      };

      if (options.body) {
        fetchOptions.body =
          typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      }

      if (this.config.logging) {
        this.logger.debug(`HTTP ${options.method ?? 'GET'} ${url}`, {
          attempt,
          headers,
        });
      }

      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorData: unknown;

        if (contentType?.includes('application/json')) {
          errorData = await response.json();
        } else {
          errorData = await response.text();
        }

        throw new HTTPError(
          response.status,
          response.statusText,
          url,
          `Error response: ${JSON.stringify(errorData)}`
        );
      }

      const contentType = response.headers.get('content-type');
      let data: T;

      if (contentType?.includes('application/json')) {
        data = (await response.json()) as T;
      } else {
        data = (await response.text()) as unknown as T;
      }

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      if (this.config.logging) {
        this.logger.debug(`HTTP response: ${response.status}`, { url });
      }

      return {
        status: response.status,
        statusText: response.statusText,
        data,
        headers: responseHeaders,
      };
    } catch (error) {
      if (error instanceof HTTPError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${options.timeout ?? this.config.timeout}ms`);
        }

        if (error.message.includes('Failed to fetch')) {
          throw new Error('Network error: Failed to fetch');
        }
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * GET request
   */
  async get<T = unknown>(
    url: string,
    options: Omit<HTTPRequestOptions, 'method' | 'body'> = {}
  ): Promise<HTTPResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = unknown>(
    url: string,
    body?: unknown,
    options: Omit<HTTPRequestOptions, 'method'> = {}
  ): Promise<HTTPResponse<T>> {
    return this.request<T>(url, { ...options, method: 'POST', body });
  }

  /**
   * PUT request
   */
  async put<T = unknown>(
    url: string,
    body?: unknown,
    options: Omit<HTTPRequestOptions, 'method'> = {}
  ): Promise<HTTPResponse<T>> {
    return this.request<T>(url, { ...options, method: 'PUT', body });
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(
    url: string,
    options: Omit<HTTPRequestOptions, 'method' | 'body'> = {}
  ): Promise<HTTPResponse<T>> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  async patch<T = unknown>(
    url: string,
    body?: unknown,
    options: Omit<HTTPRequestOptions, 'method'> = {}
  ): Promise<HTTPResponse<T>> {
    return this.request<T>(url, { ...options, method: 'PATCH', body });
  }
}
