import { PrismaClient } from "@prisma/client";

import { Request, Response } from "express";
import venom from "venom-bot";
import WebSocket from "ws";
import {
  getQrCode,
  initWhatsapp,
  isWhatsappConnected,
} from "../services/whatsappService";

const prisma = new PrismaClient();
const venomInstances = new Map<string, venom.Whatsapp>();
const wss = new WebSocket.Server({ noServer: true });

// Função para iniciar uma instância do Venom para um chip
const startVenomInstance = async (
  chipId: string,
  userId: string,
  res: Response
): Promise<any> => {
  console.log(`Tentando iniciar instância do Venom para o chip ${chipId}`);
  try {
    const client = await venom.create(
      `warmzap-${chipId}`, // Session name
      (base64Qr, asciiQR) => {
        console.log(`QR Code gerado para o chip ${chipId}:`, asciiQR);
        // ...
      },
      (statusSession) => {
        console.log(`Status da sessão para o chip ${chipId}:`, statusSession);
        // ...
      },
      { logQR: true } // Ativar logs de QR no console do Venom (para depuração)
    );

    venomInstances.set(chipId, client);
    console.log(
      `Instância do Venom iniciada com sucesso para o chip ${chipId}`
    );
    return client;
  } catch (error) {
    console.error(
      `Erro ao iniciar instância do Venom para o chip ${chipId}:`,
      error
    );
    if (res && !res.headersSent) {
      res.status(500).json({ message: "Erro ao conectar o WhatsApp" });
    }
    return null;
  }
};

// Rota para iniciar a conexão do WhatsApp para um chip
export const connectWhatsApp = async (
  req: Request,
  res: Response
): Promise<any> => {
  const userId = req.user?.id;
  const { chipId } = req.body; // Agora chipId pode ser um ID existente ou um número de telefone novo

  if (!userId || !chipId) {
    return res
      .status(400)
      .json({ message: "ID do usuário e ID do chip/número são obrigatórios" });
  }

  // Tentar encontrar um chip existente para o usuário com o chipId fornecido
  let chip = await prisma.chip.findFirst({ where: { id: chipId, userId } });

  if (!chip) {
    // Se não encontrado, pode ser um novo número de telefone para conectar
    // Aqui você pode criar um novo registro de chip com o status PENDING
    chip = await prisma.chip.create({
      data: {
        userId: userId,
        phoneNumber: chipId, // Usar o número de telefone como phoneNumber inicial
        status: "PENDING",
      },
    });
    // Agora, use o ID gerado para o novo chip para iniciar o Venom
    await startVenomInstance(chip.id, userId, res);
  } else {
    // Se o chip já existe, apenas tente conectar o WhatsApp para ele
    if (venomInstances.has(chipId)) {
      return res
        .status(200)
        .json({ message: "WhatsApp já conectado para este chip" });
    }
    await startVenomInstance(chipId, userId, res);
  }
};

// Rota para simular uma conversa
export const simulateConversation = async (
  req: Request,
  res: Response
): Promise<any> => {
  const userId = req.user?.id;
  const { chipId, contacts, messages } = req.body; // Exemplo de parâmetros

  if (!userId || !chipId || !contacts || !messages) {
    return res.status(400).json({
      message:
        "ID do usuário, ID do chip, contatos e mensagens são obrigatórios",
    });
  }

  const chip = await prisma.chip.findFirst({ where: { id: chipId, userId } });
  if (!chip) {
    return res
      .status(404)
      .json({ message: "Chip não encontrado ou não pertence ao usuário" });
  }

  const client = venomInstances.get(chipId);
  if (!client) {
    return res
      .status(400)
      .json({ message: "WhatsApp não conectado para este chip" });
  }

  try {
    for (const contact of contacts) {
      for (const message of messages) {
        await client.sendText(`${contact}@c.us`, message);
        // Simular recebimento (mais complexo, pode envolver eventos do Venom)
        await new Promise((resolve) =>
          setTimeout(resolve, Math.random() * 3000 + 1000)
        ); // Simular atraso
      }
    }
    res.status(200).json({ message: "Simulação de conversa iniciada" });
  } catch (error) {
    console.error("Erro ao simular conversa:", error);
    res.status(500).json({ message: "Erro ao simular conversa" });
  }
};

// Rota para desconectar o WhatsApp de um chip
export const disconnectWhatsApp = async (
  req: Request,
  res: Response
): Promise<any> => {
  const userId = req.user?.id;
  const { chipId } = req.body;

  if (!userId || !chipId) {
    return res
      .status(400)
      .json({ message: "ID do usuário e ID do chip são obrigatórios" });
  }

  const chip = await prisma.chip.findFirst({ where: { id: chipId, userId } });
  if (!chip) {
    return res
      .status(404)
      .json({ message: "Chip não encontrado ou não pertence ao usuário" });
  }

  const client = venomInstances.get(chipId);
  if (client) {
    await client.logout();
    venomInstances.delete(chipId);
    await prisma.chip.update({
      where: { id: chipId },
      data: { status: "PENDING" },
    });
    res.status(200).json({ message: "WhatsApp desconectado com sucesso" });
  } else {
    res.status(400).json({ message: "WhatsApp não conectado para este chip" });
  }
};

export const getQrCodeHandler = async (req: Request, res: Response) => {
  if (!isWhatsappConnected()) {
    await initWhatsapp();
  }

  const qr = getQrCode();
  if (qr) {
    res.status(200).json({ qrCode: qr });
  } else {
    res.status(202).json({ message: "Aguardando QR Code..." });
  }
};
