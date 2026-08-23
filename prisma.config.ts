import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "server/prisma/schema.prisma",
  datasource: {
    url: process.env["DATABASE_URL"] || "postgresql://postgres:Prem004@127.0.0.1:5432/helpdesk",
  },
});
