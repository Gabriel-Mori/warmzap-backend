import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Delete existing plans
  await prisma.plan.deleteMany({
    where: {
      userId: null,
    },
  });

  // Create default plans
  await prisma.plan.createMany({
    data: [
      {
        name: "Chip Avulso",
        description: "7 dias de aquecimento",
        price: 12.0,
        duration: 7,
        chipCount: 1,
        hasAI: false,
        hasAPI: false,
        hasPriority: false,
      },
      {
        name: "Pacote 5 chips",
        description: "7 dias por chip",
        price: 49.0,
        duration: 7,
        chipCount: 5,
        hasAI: false,
        hasAPI: false,
        hasPriority: false,
      },
      {
        name: "Pacote 10 chips",
        description: "7 dias por chip + IA liberada",
        price: 89.0,
        duration: 7,
        chipCount: 10,
        hasAI: true,
        hasAPI: false,
        hasPriority: false,
      },
      {
        name: "Pacote 50 chips",
        description: "7 dias por chip + IA + prioridade + API",
        price: 397.0,
        duration: 7,
        chipCount: 50,
        hasAI: true,
        hasAPI: true,
        hasPriority: true,
      },
    ],
  });

  console.log("Database seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
