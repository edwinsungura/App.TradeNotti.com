import { seedDatabase } from "../src/lib/seed";
import { prisma } from "../src/lib/db";

seedDatabase()
  .then(async (s) => {
    console.log(
      `Seeded user=${s.user} account=${s.account}: ` +
        `${s.closed} closed, ${s.rules} rules, ${s.open} open positions synced.`,
    );
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
