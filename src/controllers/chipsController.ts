import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export const getChips = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Não autorizado" });
      return;
    }

    const chips = await prisma.chip.findMany({
      where: {
        userId,
      },
      include: {
        simulations: {
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
          },
        },
        messages: {
          select: {
            id: true,
            content: true,
            direction: true,
            timestamp: true,
          },
          orderBy: {
            timestamp: "desc",
          },
          take: 1,
        },
      },
    });

    res.status(200).json(chips);
  } catch (error) {
    console.error("Get chips error:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
};

export const getChip = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ message: "Não autorizado" });
      return;
    }

    const chip = await prisma.chip.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        simulations: {
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
          },
        },
        messages: {
          select: {
            id: true,
            content: true,
            direction: true,
            timestamp: true,
          },
          orderBy: {
            timestamp: "desc",
          },
          take: 10,
        },
      },
    });

    if (!chip) {
      res.status(404).json({ message: "Chip não encontrado" });
      return;
    }

    res.status(200).json(chip);
  } catch (error) {
    console.error("Get chip error:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
};

export const createChip = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { phoneNumber } = req.body;

    if (!userId) {
      res.status(401).json({ message: "Não autorizado" });
      return;
    }

    if (!phoneNumber) {
      res.status(400).json({ message: "Número de telefone é obrigatório" });
      return;
    }

    const existingChip = await prisma.chip.findUnique({
      where: { phoneNumber },
    });

    if (existingChip) {
      res.status(400).json({ message: "Chip já existe" });
      return;
    }

    const chip = await prisma.chip.create({
      data: {
        phoneNumber,
        userId,
        status: "PENDING",
      },
    });

    res.status(201).json({
      message: "Chip criado com sucesso",
      chip,
    });
  } catch (error) {
    console.error("Create chip error:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
};

export const updateChipStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { status } = req.body;

    if (!userId) {
      res.status(401).json({ message: "Não autorizado" });
      return;
    }

    // Validate input
    if (!status) {
      res.status(400).json({ message: "Status é obrigatório" });
      return;
    }

    // Check if chip exists and belongs to user
    const chip = await prisma.chip.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!chip) {
      res.status(404).json({ message: "Chip não encontrado" });
      return;
    }

    // Update chip status
    const updatedChip = await prisma.chip.update({
      where: { id },
      data: { status },
    });

    res.status(200).json({
      message: "Status do chip atualizado com sucesso",
      chip: updatedChip,
    });
  } catch (error) {
    console.error("Update chip status error:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
};

export const deleteChip = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ message: "Não autorizado" });
      return;
    }

    // Check if chip exists and belongs to user
    const chip = await prisma.chip.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!chip) {
      res.status(404).json({ message: "Chip não encontrado" });
      return;
    }

    // Delete chip
    await prisma.chip.delete({
      where: { id },
    });

    res.status(200).json({
      message: "Chip excluído com sucesso",
    });
  } catch (error) {
    console.error("Delete chip error:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
};
