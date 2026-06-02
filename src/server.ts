import express from "express";
import cors from "cors";
import { json } from "express";
import { AppError, errorHandler } from './middleware/errorHandler';
import router from './routes/index';

const app = express();

app.use("*", cors());
app.use(json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api", router);

app.use((_req, _res, next) => {
  next(AppError.notFound("Route not found"));
});

app.use(errorHandler);

const PORT = parseInt(process.env.PORT ?? "3000", 10);

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;