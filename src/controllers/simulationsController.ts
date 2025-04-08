import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export const startSimulation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { chipId } = req.body;

    if (!userId) {
      res.status(401).json({ message: "Não autorizado" });
      return;
    }

    if (!chipId) {
      res.status(400).json({ message: "ID do chip é obrigatório" });
      return;
    }

    const chip = await prisma.chip.findFirst({ where: { id: chipId, userId } });
    if (!chip) {
      res.status(404).json({ message: "Chip não encontrado" });
      return;
    }

    await prisma.chip.update({
      where: { id: chipId },
      data: { status: "ACTIVE" },
    });
    const simulation = await prisma.simulation.create({
      data: { chipId, status: "RUNNING" },
    });

    res
      .status(201)
      .json({ message: "Simulação iniciada com sucesso", simulation });
  } catch (error) {
    console.error("Start simulation error:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
};

export const stopSimulation = async (
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

    const simulation = await prisma.simulation.findUnique({
      where: { id },
      include: { chip: true },
    });
    if (!simulation || simulation.chip.userId !== userId) {
      res.status(403).json({ message: "Não autorizado" });
      return;
    }

    const updatedSimulation = await prisma.simulation.update({
      where: { id },
      data: { status: "COMPLETED", endDate: new Date() },
    });
    res
      .status(200)
      .json({
        message: "Simulação finalizada com sucesso",
        simulation: updatedSimulation,
      });
  } catch (error) {
    console.error("Stop simulation error:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
};

export const pauseSimulation = async (
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

    const simulation = await prisma.simulation.findUnique({
      where: { id },
      include: { chip: true },
    });
    if (!simulation || simulation.chip.userId !== userId) {
      res.status(403).json({ message: "Não autorizado" });
      return;
    }

    const updatedSimulation = await prisma.simulation.update({
      where: { id },
      data: { status: "PAUSED" },
    });
    await prisma.chip.update({
      where: { id: simulation.chipId },
      data: { status: "PAUSED" },
    });

    res
      .status(200)
      .json({
        message: "Simulação pausada com sucesso",
        simulation: updatedSimulation,
      });
  } catch (error) {
    console.error("Pause simulation error:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
};

export const resumeSimulation = async (
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

    const simulation = await prisma.simulation.findUnique({
      where: { id },
      include: { chip: true },
    });
    if (!simulation || simulation.chip.userId !== userId) {
      res.status(403).json({ message: "Não autorizado" });
      return;
    }

    const updatedSimulation = await prisma.simulation.update({
      where: { id },
      data: { status: "RUNNING" },
    });
    await prisma.chip.update({
      where: { id: simulation.chipId },
      data: { status: "ACTIVE" },
    });

    res
      .status(200)
      .json({
        message: "Simulação retomada com sucesso",
        simulation: updatedSimulation,
      });
  } catch (error) {
    console.error("Resume simulation error:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
};

export const getSimulationMessages = async (
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

    const simulation = await prisma.simulation.findUnique({
      where: { id },
      include: { chip: true },
    });
    if (!simulation || simulation.chip.userId !== userId) {
      res.status(403).json({ message: "Não autorizado" });
      return;
    }

    const messages = await prisma.message.findMany({
      where: { simulationId: id },
      orderBy: { timestamp: "asc" },
    });
    res.status(200).json(messages);
  } catch (error) {
    console.error("Get simulation messages error:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
};
