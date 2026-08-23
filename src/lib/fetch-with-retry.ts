type RetryOptions = RequestInit & { retries?: number };

/**
 * Fetch wrapper that retries failed requests (network errors) with a short
 * delay between attempts. Aborts with a DOMException named "AbortError" if
 * all attempts fail, so callers can detect timeouts.
 */
export async function fetchWithRetry(
  url: string,
  options: RetryOptions = {}
): Promise<Response> {
  const { retries = 2, ...init } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetch(url, init);
    } catch (error) {
      lastError = error;

      if (attempt < retries) {
        await new Promise((resolve) =>
          setTimeout(resolve, 400 * (attempt + 1))
        );
      }
    }
  }

  throw lastError;
}
