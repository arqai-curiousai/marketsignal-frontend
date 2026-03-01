/**
 * Legacy API client — re-exports from the consolidated apiClient.
 *
 * All new code should import from `./apiClient` directly.
 * This module exists for backward compatibility only.
 */
export { apiClient, default } from './apiClient';
export type { ApiResult } from './apiClient';
