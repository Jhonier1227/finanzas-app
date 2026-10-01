// Empaqueta la app lista para el PC viejo (T6.2):
//   npm run package:deploy
// Genera deploy-dist/ con: standalone (server.js) + static + public + prisma
// + CLI de Prisma completo (para `migrate deploy` en el servidor).
import {
  cpSync,
  rmSync,
  existsSync,
  mkdirSync,
  readFileSync,
  mkdtempSync,
  createWriteStream,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
import https from "node:https";
import { createGunzip } from "node:zlib";

const OUT = "deploy-dist";
// Plataforma del PC viejo (Debian 13): su schema-engine se descarga aparte
// porque el paquete @prisma/engines de npm solo trae el binario local.
const SERVER_PLATFORM = "debian-openssl-3.0.x";
console.log("Empaquetando para despliegue...");

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);

// 1. Servidor standalone (incluye node_modules mínimo ya trazado,
//    con motores Prisma para windows y debian-openssl-3.0.x)
cpSync(".next/standalone", OUT, { recursive: true });

// 1b. Next arrastra el .env LOCAL al standalone: hay que sacarlo del paquete.
// El .env del servidor (producción) se crea a mano una sola vez (DEPLOY.md §B)
// y copiar este archivo encima lo rompería (apuntaría a la BD de desarrollo).
rmSync(`${OUT}/.env`, { force: true });
rmSync(`${OUT}/.env.local`, { force: true });

// 2. static y public NO se incluyen en standalone (según docs Next 16)
cpSync(".next/static", `${OUT}/.next/static`, { recursive: true });
if (existsSync("public")) cpSync("public", `${OUT}/public`, { recursive: true });

// 3. Prisma: schema + migraciones + seed
cpSync("prisma", `${OUT}/prisma`, { recursive: true });

// 4. CLI de Prisma completo para migraciones en el servidor.
// Copiar solo node_modules/prisma NO basta: el CLI exige a su lado
// @prisma/engines, @prisma/config y todo su cierre transitivo (c12, effect…).
// Se instala aislado en un temporal y se fusiona: npm resuelve el árbol
// exacto y no hay que adivinar paquetes (evita MODULE_NOT_FOUND en el servidor).
{
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const prismaVersion = pkg.devDependencies.prisma; // ej. ^6.19.3
  const stage = mkdtempSync(join(tmpdir(), "prisma-cli-"));
  try {
    console.log(`Instalando CLI Prisma ${prismaVersion} aislado...`);
    execSync(
      `npm install --prefix "${stage}" --no-save --omit=dev --no-audit --no-fund "prisma@${prismaVersion}"`,
      { stdio: "inherit" }
    );
    const enginesDir = join(stage, "node_modules", "@prisma", "engines");
    await downloadSchemaEngine(enginesDir);
    cpSync(join(stage, "node_modules"), join(OUT, "node_modules"), {
      recursive: true,
    });
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
}

console.log(`Listo: ${OUT}/`);
console.log("Siguiente paso: seguir deploy/DEPLOY.md");

/**
 * Descarga el schema-engine del SERVIDOR (Debian 13) al staging.
 * El commit de motores se lee del propio árbol instalado
 * (@prisma/engines-version), sin hardcodear nada.
 */
function downloadSchemaEngine(enginesDir) {
  const { prisma: meta } = JSON.parse(
    readFileSync(
      join(enginesDir, "..", "engines-version", "package.json"),
      "utf8"
    )
  );
  const commit = meta.enginesVersion;
  const file = `schema-engine-${SERVER_PLATFORM}`;
  const url = `https://binaries.prisma.sh/all_commits/${commit}/${SERVER_PLATFORM}/schema-engine.gz`;
  const dest = join(enginesDir, file);
  console.log(`Descargando schema-engine para ${SERVER_PLATFORM}...`);
  return new Promise((resolve, reject) => {
    const fetch = (u) =>
      https
        .get(u, (res) => {
          if (res.statusCode === 301 || res.statusCode === 302) {
            fetch(res.headers.location);
            return;
          }
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode} en ${u}`));
            return;
          }
          const out = createWriteStream(dest, { mode: 0o755 });
          res.pipe(createGunzip()).pipe(out);
          out.on("finish", () => {
            console.log(`Motor Debian listo (${statSync(dest).size} bytes)`);
            resolve();
          });
          out.on("error", reject);
        })
        .on("error", reject);
    fetch(url);
  });
}
