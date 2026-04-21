import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import apiRouter from "./routes/index.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    })
  );
  app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.use("/api", apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
