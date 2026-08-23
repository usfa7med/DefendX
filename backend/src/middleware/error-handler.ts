import type { ErrorHandler } from "hono";

export const errorHandler: ErrorHandler = (err, c) => {
  console.error(`[ERROR] ${err.message}`, err.stack);

  if (err.message.includes("JSON")) {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  return c.json({ error: "Internal Server Error" }, 500);
};
