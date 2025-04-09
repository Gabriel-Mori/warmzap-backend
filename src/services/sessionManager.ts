import { Whatsapp } from "venom-bot";

export const activeSessions: Record<string, Whatsapp> = {}; // Armazena sessões ativas

export const addSession = (chipId: string, client: Whatsapp) => {
  console.log(`Adicionando sessão para chipId: ${chipId}`);
  activeSessions[chipId] = client;
  console.log("activeSessions atualizado:", activeSessions);
};

export const getSession = (chipId: string): Whatsapp | undefined => {
  console.log(`Buscando sessão para chipId: ${chipId}`);
  return activeSessions[chipId];
};

export const removeSession = (chipId: string) => {
  delete activeSessions[chipId];
};
