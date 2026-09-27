// Semilla: usuario demo de emergencia para Fase 1 (la API filtra por userId,
// y hasta que exista autenticación real —Fase 2— se usa este usuario).
// No tiene contraseña válida: nadie puede iniciar sesión como demo.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const email = "demo@finanzas.local";

async function main() {
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash: "cuenta-demo-sin-login",
    },
  });
  console.log(`Usuario demo listo: ${user.email} (${user.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
