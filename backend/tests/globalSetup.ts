import type { GlobalSetupContext } from "vitest/node";
import { MongoMemoryServer } from "mongodb-memory-server";

declare module "vitest" {
  export interface ProvidedContext {
    mongoUri: string;
  }
}

/** One in-memory MongoDB for the whole run (or use MONGO_TEST_URI if given). */
export default async function setup({ provide }: GlobalSetupContext) {
  if (process.env.MONGO_TEST_URI) {
    provide("mongoUri", process.env.MONGO_TEST_URI);
    return;
  }
  const server = await MongoMemoryServer.create();
  provide("mongoUri", server.getUri("pulsa-test"));
  return async () => {
    await server.stop();
  };
}
