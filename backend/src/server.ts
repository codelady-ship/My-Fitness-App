import { config } from "./config";
import { connectDb, disconnectDb } from "./db";
import { createApp } from "./app";

async function main() {
  await connectDb(config.mongoUri);
  const app = createApp();
  const server = app.listen(config.port, () => {
    console.log(`Pulsa API listening on :${config.port} (${config.env})`);
  });

  const shutdown = (signal: string) => {
    console.log(`${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
