/**
 * Error categorization for user-friendly error messages.
 *
 * Maps HTTP status codes and error types to human-readable messages
 * that users can actually understand and act on.
 */

export type ErrorCategory =
  | "NETWORK"
  | "AUTH"
  | "VALIDATION"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "SERVER"
  | "UNKNOWN";

interface CategorizedError {
  category: ErrorCategory;
  title: string;
  message: string;
  recoverable: boolean;
  /** Suggested action for the user */
  action?: string;
}

/**
 * Categorize an API error into a user-friendly message.
 */
export function categorizeError(
  status?: number,
  detail?: string
): CategorizedError {
  if (!status || status === 0) {
    return {
      category: "NETWORK",
      title: "Connection Issue",
      message: "Unable to reach the server. Check your internet connection.",
      recoverable: true,
      action: "Try again",
    };
  }

  switch (status) {
    case 400:
      return {
        category: "VALIDATION",
        title: "Invalid Request",
        message: detail || "Please check your input and try again.",
        recoverable: true,
        action: "Fix and retry",
      };
    case 401:
      return {
        category: "AUTH",
        title: "Session Expired",
        message: "Your session has expired. Please log in again.",
        recoverable: true,
        action: "Log in",
      };
    case 403:
      return {
        category: "AUTH",
        title: "Access Denied",
        message: "You don't have permission to perform this action.",
        recoverable: false,
      };
    case 404:
      return {
        category: "NOT_FOUND",
        title: "Not Found",
        message: detail || "The requested resource was not found.",
        recoverable: false,
      };
    case 409:
      return {
        category: "VALIDATION",
        title: "Conflict",
        message: detail || "This action conflicts with the current state.",
        recoverable: true,
        action: "Refresh and retry",
      };
    case 422:
      return {
        category: "VALIDATION",
        title: "Validation Error",
        message: detail || "The data provided is invalid.",
        recoverable: true,
        action: "Fix and retry",
      };
    case 429:
      return {
        category: "RATE_LIMITED",
        title: "Too Many Requests",
        message: "You're making requests too quickly. Please wait a moment.",
        recoverable: true,
        action: "Wait and retry",
      };
    default:
      if (status >= 500) {
        return {
          category: "SERVER",
          title: "Server Error",
          message:
            "Something went wrong on our end. We're working on it.",
          recoverable: true,
          action: "Try again later",
        };
      }
      return {
        category: "UNKNOWN",
        title: "Error",
        message: detail || "An unexpected error occurred.",
        recoverable: true,
        action: "Try again",
      };
  }
}

/**
 * Get a toast-appropriate short message from an error.
 */
export function getErrorToastMessage(
  status?: number,
  detail?: string
): string {
  const categorized = categorizeError(status, detail);
  return categorized.message;
}
