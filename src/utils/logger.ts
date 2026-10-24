export type LogLevel = "debug" | "info" | "warn" | "error";

class Logger {
  private isDevelopment(): boolean {
    return (
      typeof import.meta !== "undefined" &&
      Boolean(import.meta.env?.DEV)
    );
  }

  public debug(message: string, ...args: unknown[]): void {
    if (this.isDevelopment()) {
      console.debug(`[DeskPaper:DEBUG] ${message}`, ...args);
    }
  }

  public info(message: string, ...args: unknown[]): void {
    if (this.isDevelopment()) {
      console.info(`[DeskPaper:INFO] ${message}`, ...args);
    }
  }

  public warn(message: string, ...args: unknown[]): void {
    console.warn(`[DeskPaper:WARN] ${message}`, ...args);
  }

  public error(message: string, ...args: unknown[]): void {
    console.error(`[DeskPaper:ERROR] ${message}`, ...args);
  }
}

export const logger = new Logger();
