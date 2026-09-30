// Empaqueta la app lista para el PC viejo (T6.2):
//   npm run package:deploy
// Genera deploy-dist/ con: standalone (server.js) + static + public + prisma
// + CLI de Prisma (para `migrate deploy` en el servidor).
import { cpSync, rmSync, existsSync, mkdirSync } from "node:fs";

const OUT = "deploy-dist";

console.log("Empaquetando para despliegue...");

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);

// 1. Servidor standalone (incluye node_modules mínimo ya trazado,
//    con motores Prisma para windows y debian-openssl-3.0.x)
cpSync(".next/standalone", OUT, { recursive: true });

// 2. static y public NO se incluyen en standalone (según docs Next 16)
cpSync(".next/static", `${OUT}/.next/static`, { recursive: true });
if (existsSync("public")) cpSync("public", `${OUT}/public`, { recursive: true });

// 3. Prisma: schema + migraciones + seed
cpSync("prisma", `${OUT}/prisma`, { recursive: true });

// 4. CLI de Prisma para migraciones en el servidor (no viene en standalone
//    porque el código de la app no lo importa)
cpSync("node_modules/prisma", `${OUT}/node_modules/prisma`, {
  recursive: true,
});
cpSync("node_modules/.bin", `${OUT}/node_modules/.bin`, { recursive: true });

console.log(`Listo: ${OUT}/`);
console.log("Siguiente paso: seguir deploy/DEPLOY.md");
