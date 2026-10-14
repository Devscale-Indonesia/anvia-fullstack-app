import { definePrismaConfig } from "@prisma/cli-engine";
import { defineConfig as ormConfig } from "@prisma/orm-postgres/config";

// DATABASE_URL comes from the root .env (loaded by the db:* scripts).
export default definePrismaConfig({
  orm: ormConfig({
    contract: "./prisma/schema.prisma",
    db: {
      connection: process.env.DATABASE_URL!,
    },
  }),
});
