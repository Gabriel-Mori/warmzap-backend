import { create, Whatsapp } from "venom-bot";

const clients: Map<string, Whatsapp> = new Map();

export const initWhatsapp = async () => {
  // Você pode inicializar um cliente padrão aqui, se necessário,
  // ou deixar para criar clientes sob demanda.
  console.log("Serviço WhatsApp iniciado.");
};

export const getWhatsappClient = (sessionId: string): Whatsapp | undefined => {
  return clients.get(sessionId);
};

export const createWhatsappClient = async (
  sessionId: string,
  qrCallback: (qr: string) => void
): Promise<Whatsapp> => {
  if (clients.has(sessionId)) {
    return clients.get(sessionId)!;
  }

  const client = await create(sessionId, qrCallback, undefined, {
    headless: false,
    logQR: false,
    browserArgs: ["--no-sandbox"],
  });
  clients.set(sessionId, client);
  return client;
};

export const deleteWhatsappClient = async (
  sessionId: string
): Promise<void> => {
  const client = clients.get(sessionId);
  if (client) {
    await client.logout();
    clients.delete(sessionId);
    console.log(`Sessão ${sessionId} encerrada.`);
  }
};
