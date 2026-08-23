import type { MiddlewareHandler } from "hono";
import { env } from "../config/index.js";

const API_KEY_HEADER = "defendx-api-key";

export const requireApiKey: MiddlewareHandler = async (c, next) => {

  if (c.req.path === "/health") {
    return next();
  }

  const apiKey = c.req.header(API_KEY_HEADER);

  if (!apiKey || apiKey !== env.DEFENDX_API_KEY) {
    return c.json(
      { error: "Unauthorized", message: "Missing or invalid API key" },
      401,
    );
  }

  await next();
};
