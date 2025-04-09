import { ChipStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getChipsByUser = async (userId: string) => {
  return await prisma.chip.findMany({
    where: { userId },
    include: {
      simulations: {
        select: { id: true, status: true, startDate: true, endDate: true },
      },
      messages: {
        select: { id: true, content: true, direction: true, timestamp: true },
        orderBy: { timestamp: "desc" },
        take: 1,
      },
    },
  });
};

export const getChipById = async (userId: string, chipId: string) => {
  return await prisma.chip.findFirst({
    where: { id: chipId, userId },
    include: {
      simulations: {
        select: { id: true, status: true, startDate: true, endDate: true },
      },
      messages: {
        select: { id: true, content: true, direction: true, timestamp: true },
        orderBy: { timestamp: "desc" },
        take: 10,
      },
    },
  });
};

export const createChip = async (userId: string, phoneNumber: string) => {
  const existingChip = await prisma.chip.findUnique({ where: { phoneNumber } });

  if (existingChip) {
    throw new Error("Chip já existe");
  }

  return await prisma.chip.create({
    data: { phoneNumber, userId, status: "PENDING" },
  });
};

export const updateChipStatus = async (
  userId: string,
  chipId: string,
  status: ChipStatus
) => {
  const chip = await prisma.chip.findFirst({ where: { id: chipId, userId } });

  if (!chip) {
    throw new Error("Chip não encontrado");
  }

  return await prisma.chip.update({
    where: { id: chipId },
    data: { status },
  });
};

export const deleteChip = async (userId: string, chipId: string) => {
  const chip = await prisma.chip.findFirst({ where: { id: chipId, userId } });

  if (!chip) {
    throw new Error("Chip não encontrado");
  }

  await prisma.chip.delete({ where: { id: chipId } });
};
