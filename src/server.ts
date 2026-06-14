import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";

const server = app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server is running on http://localhost:${env.PORT}`);
});

const shutdown = async (signal: string) => {
  // eslint-disable-next-line no-console
  console.log(`\n[${signal}] shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
