"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { getErrorToastMessage } from "@/lib/errors";
import type { ApiResult } from "@/lib/api/apiClient";

interface UseApiActionOptions<T> {
  /** Toast message on success (set to null to suppress) */
  successMessage?: string | null;
  /** Toast message on error (auto-generated from status if not provided) */
  errorMessage?: string;
  /** Callback on success */
  onSuccess?: (data: T) => void;
  /** Callback on error */
  onError?: (error: { status: number; message: string }) => void;
}

/**
 * Hook that wraps an API call with automatic toast notifications.
 *
 * Usage:
 *   const { execute, loading } = useApiAction(
 *     () => watchlistApi.addToWatchlist(ticker),
 *     { successMessage: "Added to watchlist" }
 *   );
 */
export function useApiAction<T>(
  apiFn: () => Promise<ApiResult<T>>,
  options: UseApiActionOptions<T> = {}
) {
  const [loading, setLoading] = useState(false);

  const execute = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiFn();

      if (result.success) {
        if (options.successMessage !== null) {
          toast.success(options.successMessage || "Done");
        }
        options.onSuccess?.(result.data);
        return result.data;
      } else {
        const errorMsg =
          options.errorMessage ||
          getErrorToastMessage(result.error.status, result.error.message);
        toast.error(errorMsg);
        options.onError?.(result.error);
        return null;
      }
    } catch {
      toast.error("Network error. Please check your connection.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiFn, options]);

  return { execute, loading };
}
