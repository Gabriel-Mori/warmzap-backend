import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export const getPlans = async (req: Request, res: Response): Promise<any> => {
  try {
    const plans = await prisma.plan.findMany({
      where: {
        userId: null,
      },
    });

    return res.status(200).json(plans);
  } catch (error) {
    console.error("Get plans error:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
};

export const getPlan = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    const plan = await prisma.plan.findUnique({
      where: { id },
    });

    if (!plan) {
      return res.status(404).json({ message: "Plano não encontrado" });
    }

    if (plan.userId) {
      const userId = req.user?.id;

      if (!userId || plan.userId !== userId) {
        return res.status(403).json({ message: "Não autorizado" });
      }
    }

    return res.status(200).json(plan);
  } catch (error) {
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

export const purchasePlan = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user?.id;
    const { planId } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Não autorizado" });
    }

    if (!planId) {
      return res.status(400).json({ message: "ID do plano é obrigatório" });
    }

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return res.status(404).json({ message: "Plano não encontrado" });
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

    return res.status(201).json({
      message: "Plano adquirido com sucesso",
      plan: userPlan,
    });
  } catch (error) {
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

export const getUserPlans = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Não autorizado" });
    }

    const plans = await prisma.plan.findMany({
      where: {
        userId,
      },
    });

    return res.status(200).json(plans);
  } catch (error) {
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};
