import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export const getPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const plans = await prisma.plan.findMany({
      where: {
        userId: null,
      },
    });

    res.status(200).json(plans);
  } catch (error) {
    console.error("Get plans error:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
};

export const getPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const plan = await prisma.plan.findUnique({
      where: { id },
    });

    if (!plan) {
      res.status(404).json({ message: "Plano não encontrado" });
      return;
    }

    if (plan.userId) {
      const userId = req.user?.id;

      if (!userId || plan.userId !== userId) {
        res.status(403).json({ message: "Não autorizado" });
        return;
      }
    }

    res.status(200).json(plan);
  } catch (error) {
    console.error("Get plan error:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
};

export const purchasePlan = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { planId } = req.body;

    if (!userId) {
      res.status(401).json({ message: "Não autorizado" });
      return;
    }

    if (!planId) {
      res.status(400).json({ message: "ID do plano é obrigatório" });
      return;
    }

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      res.status(404).json({ message: "Plano não encontrado" });
      return;
    }

    const userPlan = await prisma.plan.create({
      data: {
        name: plan.name,
        description: plan.description,
        price: plan.price,
        duration: plan.duration,
        chipCount: plan.chipCount,
        hasAI: plan.hasAI,
        hasAPI: plan.hasAPI,
        hasPriority: plan.hasPriority,
        userId,
      },
    });

    res.status(201).json({
      message: "Plano adquirido com sucesso",
      plan: userPlan,
    });
  } catch (error) {
    console.error("Purchase plan error:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
};

export const getUserPlans = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Não autorizado" });
      return;
    }

    const plans = await prisma.plan.findMany({
      where: {
        userId,
      },
    });

    res.status(200).json(plans);
  } catch (error) {
    console.error("Get user plans error:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
};
