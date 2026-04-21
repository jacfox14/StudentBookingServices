import { env } from "./config/env.js";
import { sequelize } from "./config/db.js";
import "./models/index.js";
import { createApp } from "./app.js";

async function main() {
  try {
    await sequelize.authenticate();
    console.log("DB connection established.");
  } catch (err) {
    console.error("Unable to connect to the database:", err);
    process.exit(1);
  }

  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`SBS API listening on http://localhost:${env.PORT}`);
    console.log(`CORS origin: ${env.CLIENT_ORIGIN}`);
  });
}

main();
