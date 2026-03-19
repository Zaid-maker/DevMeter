import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { withLingo } from "@lingo.dev/compiler/next";

const configDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {
    root: configDir,
  },
};

export default withLingo(nextConfig, {
  sourceRoot: "./app",
  sourceLocale: "en",
  targetLocales: ["es", "fr", "de"],
  lingoDir: "./.lingo",
  models: "lingo.dev",
  useDirective: true,
  localePersistence: "cookie",
});
