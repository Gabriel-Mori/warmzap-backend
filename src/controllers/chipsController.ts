import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { create, Whatsapp } from "venom-bot";
import {
  createChip,
  deleteChip,
  getChipById,
  getChipsByUser,
  updateChipStatus,
} from "../services/chipService";
import { addSession, removeSession } from "../services/sessionManager";
import { deleteWhatsappClient } from "../whatsapp/whatsappClient";

const prisma = new PrismaClient();
const activeSessions: Record<string, Whatsapp> = {};

export const verifyChipOwnership = async (
  userId: string,
  chipId: string
): Promise<boolean> => {
  try {
    if (!chipId) {
      console.error("Erro: chipId não foi fornecido corretamente.");
      return false;
    }

    const chip = await prisma.chip.findUnique({
      where: {
        id: chipId,
      },
    });
    return !!chip;
  } catch (error) {
    console.error("Erro ao verificar a propriedade do chip:", error);
    return false;
  }
};

export const getChips = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Não autorizado" });
    }
    const chips = await getChipsByUser(userId);
    return res.status(200).json(chips);
  } catch (error) {
    console.error("Get chips error:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
};

export const getChip = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json({ message: "Não autorizado" });
    }
    const chip = await getChipById(userId, id);
    if (!chip) {
      return res.status(404).json({ message: "Chip não encontrado" });
    }
    return res.status(200).json(chip);
  } catch (error) {
    console.error("Get chip error:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

export const createChipController = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user?.id;
    const { phoneNumber } = req.body;
    if (!userId) {
      return res.status(401).json({ message: "Não autorizado" });
    }
    if (!phoneNumber) {
      return res
        .status(400)
        .json({ message: "Número de telefone é obrigatório" });
    }
    const chip = await createChip(userId, phoneNumber);
    return res.status(201).json({ message: "Chip criado com sucesso", chip });
  } catch (error: any) {
    return res
      .status(400)
      .json({ message: error.message || "Erro interno do servidor" });
  }
};

export const updateChipStatusController = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { status } = req.body;
    if (!userId) {
      return res.status(401).json({ message: "Não autorizado" });
    }
    if (!status) {
      return res.status(400).json({ message: "Status é obrigatório" });
    }
    const updatedChip = await updateChipStatus(userId, id, status);
    return res.status(200).json({
      message: "Status do chip atualizado com sucesso",
      chip: updatedChip,
    });
  } catch (error: any) {
    return res
      .status(400)
      .json({ message: error.message || "Erro interno do servidor" });
  }
};

export const deleteChipController = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json({ message: "Não autorizado" });
    }
    await deleteChip(userId, id);
    return res.status(200).json({ message: "Chip excluído com sucesso" });
  } catch (error: any) {
    return res
      .status(400)
      .json({ message: error.message || "Erro interno do servidor" });
  }
};

export const connectWhatsApp = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { chipId } = req.body;

    if (activeSessions[chipId]) {
      return res
        .status(200)
        .json({ message: `Sessão para o chip ${chipId} já está ativa.` });
    }

    let responseSent = false;

    create(
      chipId,
      (base64Qrimg) => {
        if (!responseSent) {
          responseSent = true;
          res.json({ qrCode: base64Qrimg, status: "waiting_qr" });
        }
      },
      (statusSession) => {
        console.log(`Status Session: ${statusSession} para o chip ${chipId}`);
      },
      {
        headless: "new",
      }
    )
      .then(async (client) => {
        activeSessions[chipId] = client;
        addSession(chipId, client); //

        client.onStateChange(async (state) => {
          console.log(`State changed: ${state} para o chip ${chipId}`);

          try {
            await prisma.chip.update({
              where: { id: chipId },
              data: { isConnected: state === "CONNECTED" },
            });

            if (state === "CONNECTED") {
              // Salva a sessão no banco usando 'token' como identificador único
              await prisma.session.upsert({
                where: { token: chipId }, // Corrigido para usar um campo único
                update: { isActive: true, loggedOutAt: null },
                create: { userId: chipId, token: chipId, isActive: true },
              });

              if (!responseSent) {
                responseSent = true;
                res.json({ status: "connected" });
              }
            }
          } catch (error) {
            console.error("Erro ao atualizar a sessão no banco:", error);
          }

          if (["DISCONNECTED", "LOST"].includes(state)) {
            delete activeSessions[chipId];
            removeSession(chipId);
            // Atualiza a sessão no banco para inativa
            await prisma.session.updateMany({
              where: { token: chipId },
              data: { isActive: false, loggedOutAt: new Date() },
            });
          }
        });
      })
      .catch((erro) => {
        console.error(
          `Erro ao iniciar ou restaurar a sessão do WhatsApp para o chip ${chipId}:`,
          erro
        );
        return res
          .status(500)
          .json({ error: "Erro ao iniciar ou restaurar a sessão." });
      });
  } catch (error) {
    console.error("Erro na rota /chips/connect:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
};

export const getWhatsAppStatus = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user?.id;
    const { id: chipId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Não autorizado" });
    }
    console.log("Valor de chipId:", chipId);

    if (!chipId) {
      return res.status(400).json({ error: "chipId é obrigatório" });
    }

    const activeClient = activeSessions[chipId];

    if (activeClient) {
      try {
        return res.json({
          status: (await activeClient.isLoggedIn())
            ? "CONNECTED"
            : "DISCONNECTED",
        });
      } catch (error) {
        console.error(
          `Erro ao verificar o status de login do WhatsApp para ${chipId}:`,
          error
        );

        const chip = await prisma.chip.findUnique({ where: { id: chipId } });
        return res.json({
          status: chip?.isConnected ? "CONNECTED" : "DISCONNECTED",
        });
      }
    } else {
      // Se não houver sessão ativa, retorna o status do banco de dados
      const chip = await prisma.chip.findUnique({ where: { id: chipId } });
      return res.json({
        status: chip?.isConnected ? "CONNECTED" : "DISCONNECTED",
      });
    }
  } catch (error) {
    console.error("Erro ao obter o status do WhatsApp:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
};

// Função para desconectar uma sessão
export const disconnectWhatsApp = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user?.id;
    const { chipId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Não autorizado" });
    }

    const isOwner = await verifyChipOwnership(userId, chipId);
    if (!isOwner) {
      return res
        .status(403)
        .json({ error: "Este chip não pertence ao usuário." });
    }

    await deleteWhatsappClient(chipId);
  } catch (error) {
    console.error("Erro ao desconectar o WhatsApp:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
};

// export const onMessageClient = async  (client: Whatsapp): Promise<any> => {
//   client.onMessage(async (message: { body: string; from: any; fromMe: any; }) => {
//     console.log('Mensagem recebida (Venom):', message.body, 'de', message.from);
//     const clientIdFrom = Object.keys(venomClients).find(key => venomClients.get(key).page.wid._serialized === message.from);
//     if (clientIdFrom) {
//       try {
//         const chat = await prisma.chat.findUnique({
//           where: { clientId: clientIdFrom },
//         });
//         if (chat) {
//           await prisma.message.create({
//             data: {
//               chatId: chat.id,
//               sender: message.from,
//               content: message.body,
//             },
//           });
//         }
//       } catch (error) {
//         console.error('Erro ao salvar mensagem:', error);
//       }
//     }

//     // Lógica de resposta automática para simular conversa
//     if (message.fromMe) {
//       // Ignora mensagens enviadas por você mesmo para evitar loops
//       return;
//     }

//     const lowerCaseMessage = message.body.toLowerCase().trim();

//     if (lowerCaseMessage.includes('olá') || lowerCaseMessage.includes('oi') || lowerCaseMessage.includes('bom dia') || lowerCaseMessage.includes('boa tarde') || lowerCaseMessage.includes('boa noite')) {
//       setTimeout(async () => {
//         await client.reply(message.from, 'Olá! Como posso ajudar?');
//       }, Math.random() * 3000 + 1000); // Responder após 1-4 segundos aleatoriamente
//     } else if (lowerCaseMessage.includes('tudo bem') || lowerCaseMessage.includes('como você está')) {
//       setTimeout(async () => {
//         await client.reply(message.from, 'Tudo bem por aqui! E você?');
//       }, Math.random() * 3000 + 1000);
//     } else if (lowerCaseMessage.includes('sim') || lowerCaseMessage.includes('não')) {
//       setTimeout(async () => {
//         await client.reply(message.from, 'Entendo.');
//       }, Math.random() * 2000 + 500);
//     } else {
//       // Resposta genérica para outras mensagens
//       setTimeout(async () => {
//         await client.reply(message.from, 'Recebi sua mensagem.');
//       }, Math.random() * 4000 + 1500);
//     }
//   });
// }
