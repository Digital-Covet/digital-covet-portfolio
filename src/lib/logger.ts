type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
  timestamp?: string;
}

class Logger {
  private log(level: LogLevel, message: string, context?: LogContext) {
    const entry = {
      level,
      message,
      ...context,
      timestamp: context?.timestamp ?? new Date().toISOString(),
      environment: process.env.NODE_ENV,
    };

    if (process.env.NODE_ENV === "production") {
      // Extend with external logging service (Sentry, Datadog, etc.)
      // await fetch("/api/logs", { method: "POST", body: JSON.stringify(entry) });
    }

    console[level](JSON.stringify(entry));
  }

  debug(message: string, context?: LogContext) {
    this.log("debug", message, context);
  }

  info(message: string, context?: LogContext) {
    this.log("info", message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log("warn", message, context);
  }

  error(message: string, context?: LogContext) {
    this.log("error", message, context);
  }
}

export const logger = new Logger();
