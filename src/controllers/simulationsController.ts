// controllers/simulationsController.ts
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { Whatsapp } from "venom-bot";
import { getSession } from "../services/sessionManager";

const prisma = new PrismaClient();
const activeSessions: Record<string, Whatsapp> = {};
const simulationIntervals: Record<string, NodeJS.Timeout> = {};
interface HostDevice {
  id: { _serialized: string };
}

// Função auxiliar para enviar uma mensagem
const sendMessage = async (
  client: Whatsapp,
  simulationId: string,
  from: string,
  to: string,
  content: string,
  chipId: string
) => {
  try {
    console.log(`Mensagem enviada de ${from} para ${to}: ${content}`);
    await client.sendText(to, content);

    // Adicione um pequeno delay
    // await new Promise((resolve) => setTimeout(resolve, 1000)); // Espera 1 segundo

    // const hostDevice = (await client.getHostDevice()) as Partial<HostDevice>;
    // console.log("hostDevice: ", hostDevice);
    // const direction = hostDevice.wid?._serialized || "unknown";

    // await prisma.message.create({
    //   data: {
    //     simulationId: simulationId,
    //     from: from,
    //     to: to,
    //     content: content,
    //     direction: from === direction ? "OUTBOUND" : "INBOUND",
    //     timestamp: new Date(),
    //     chipId: chipId,
    //   },
    // });
  } catch (error) {
    console.error(`Erro ao enviar mensagem de ${from} para ${to}:`, error);
  }
};

export const startSimulation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { chipId } = req.params;

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

    const activeClient = getSession(chipId);
    console.log("activeClient: ", activeClient);
    if (!activeClient) {
      res
        .status(400)
        .json({ message: "WhatsApp não está conectado para este chip." });
      return;
    }

    const simulation = await prisma.simulation.create({
      data: { chipId, status: "RUNNING", startDate: new Date() },
    });

    const contacts = ["5544999538643@c.us"];
    console.log("contacts: ", contacts);
    const messages = [
      "Olá!",
      "Tudo bem?",
      "Como vai você?",
      "Que legal!",
      "Entendi.",
    ];
    const responseMessages = ["Sim", "Não", "Tudo ótimo", "Obrigado"];
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Espera 1 segundo
    const hostDevice = (await activeClient.getHostDevice()) as HostDevice;
    console.log("hostDeviceeeeeeeeeeee: ", hostDevice);
    const botNumber = hostDevice?.id?._serialized;
    console.log("botNumberrrrrrrrrr: ", botNumber);

    const interval = setInterval(async () => {
      const randomContact =
        contacts[Math.floor(Math.random() * contacts.length)];
      const randomMessage =
        messages[Math.floor(Math.random() * messages.length)];
      const randomResponse =
        responseMessages[Math.floor(Math.random() * responseMessages.length)];

      if (!randomContact) {
        console.error("Erro: randomContact está indefinido.");
        return;
      }

      if (!botNumber) {
        console.error("Erro: botNumber está indefinido. Verifique a sessão.");
        clearInterval(interval); // Interrompe o intervalo para evitar mais erros
        return;
      }

      console.log(`Enviando mensagem de ${botNumber} para ${randomContact}`);

      await sendMessage(
        activeClient,
        simulation.id,
        botNumber,
        randomContact,
        randomMessage,
        chipId
      );
      await sendMessage(
        activeClient,
        simulation.id,
        randomContact,
        botNumber,
        randomResponse,
        chipId
      );
    }, Math.random() * 5000 + 3000);

    simulationIntervals[simulation.id] = interval;

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
    const { id: simulationId } = req.params;

    if (!userId) {
      res.status(401).json({ message: "Não autorizado" });
      return;
    }

    const simulation = await prisma.simulation.findUnique({
      where: { id: simulationId },
      include: { chip: true },
    });
    if (!simulation || simulation.chip.userId !== userId) {
      res.status(403).json({ message: "Não autorizado" });
      return;
    }

    const updatedSimulation = await prisma.simulation.update({
      where: { id: simulationId },
      data: { status: "COMPLETED", endDate: new Date() },
    });

    if (simulationIntervals[simulationId]) {
      clearInterval(simulationIntervals[simulationId]);
      delete simulationIntervals[simulationId];
    }

    res.status(200).json({
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
    const { id: simulationId } = req.params;

    if (!userId) {
      res.status(401).json({ message: "Não autorizado" });
      return;
    }

    const simulation = await prisma.simulation.findUnique({
      where: { id: simulationId },
      include: { chip: true },
    });
    if (!simulation || simulation.chip.userId !== userId) {
      res.status(403).json({ message: "Não autorizado" });
      return;
    }

    const updatedSimulation = await prisma.simulation.update({
      where: { id: simulationId },
      data: { status: "PAUSED" },
    });
    await prisma.chip.update({
      where: { id: simulation.chipId },
      data: { status: "PAUSED" },
    });

    if (simulationIntervals[simulationId]) {
      clearInterval(simulationIntervals[simulationId]);
    }

    res.status(200).json({
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
    const { id: simulationId } = req.params;

    if (!userId) {
      res.status(401).json({ message: "Não autorizado" });
      return;
    }

    const simulation = await prisma.simulation.findUnique({
      where: { id: simulationId },
      include: { chip: true },
    });
    if (!simulation || simulation.chip.userId !== userId) {
      res.status(403).json({ message: "Não autorizado" });
      return;
    }

    const updatedSimulation = await prisma.simulation.update({
      where: { id: simulationId },
      data: { status: "RUNNING" },
    });
    await prisma.chip.update({
      where: { id: simulation.chipId },
      data: { status: "ACTIVE" },
    });

    const activeClient = activeSessions[simulation.chipId];
    if (activeClient && !simulationIntervals[simulationId]) {
      const contacts = ["5544999538643"];
      const messages = [
        "Olá novamente!",
        "Como está indo?",
        "Mais alguma coisa?",
        "Certo.",
        "Até mais!",
      ];
      const responseMessages = [
        "Estou bem, obrigado!",
        "Nada por agora.",
        "Ok",
        "Até logo!",
      ];

      const hostDevice = (await activeClient.getHostDevice()) as HostDevice;

      const botNumber = hostDevice?.id?._serialized;

      const interval = setInterval(async () => {
        const randomContact =
          contacts[Math.floor(Math.random() * contacts.length)];
        const randomMessage =
          messages[Math.floor(Math.random() * messages.length)];
        const randomResponse =
          responseMessages[Math.floor(Math.random() * responseMessages.length)];

        await sendMessage(
          activeClient,
          simulationId,
          botNumber,
          randomContact,
          randomMessage,
          simulation.chipId
        );

        await sendMessage(
          activeClient,
          simulationId,
          randomContact,
          botNumber,
          randomResponse,
          simulation.chipId
        );
      }, Math.random() * 5000 + 3000);

      simulationIntervals[simulationId] = interval;
    }

    res.status(200).json({
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
    const { id: simulationId } = req.params;

    if (!userId) {
      res.status(401).json({ message: "Não autorizado" });
      return;
    }

    const simulation = await prisma.simulation.findUnique({
      where: { id: simulationId },
      include: { chip: true },
    });
    if (!simulation || simulation.chip.userId !== userId) {
      res.status(403).json({ message: "Não autorizado" });
      return;
    }

    const messages = await prisma.message.findMany({
      where: { simulationId: simulationId },
      orderBy: { timestamp: "asc" },
    });
    res.status(200).json(messages);
  } catch (error) {
    console.error("Get simulation messages error:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
};
