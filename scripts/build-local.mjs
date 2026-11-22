import { fileURLToPath } from "node:url";

// Run the installed Next CLI in this process; keep normal deployment builds unchanged.
process.env.VEGGIEMATE_LOCAL_BUILD = "1";
process.argv = [
  process.execPath,
  fileURLToPath(import.meta.resolve("next/dist/bin/next")),
  "build",
  "--webpack",
  ...process.argv.slice(2),
];
await import("next/dist/bin/next");
