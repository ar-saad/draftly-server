type LogLevel = "info" | "warn" | "error";

export function log(
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>,
) {
  const timestamp = new Date().toISOString();

  const payload = {
    timestamp,
    level,
    message,
    ...(meta && { meta }),
  };

  switch (level) {
    case "error":
      console.error(payload);
      break;
    case "warn":
      console.warn(payload);
      break;
    default:
      console.log(payload);
  }
}
