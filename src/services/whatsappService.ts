import { create, Whatsapp } from "venom-bot";

let client: Whatsapp | null = null;
let qrCodeBase64: string | null = null;

export const initWhatsapp = async () => {
  client = await create(
    "warmzap-session",
    (base64Qrimg, asciiQR, attempts, urlCode) => {
      qrCodeBase64 = base64Qrimg;
      console.log("QR gerado!");
    },
    undefined,
    {
      logQR: false,
      headless: false, // abre o navegador pra facilitar debug
      browserArgs: ["--no-sandbox"], // usa o Chrome instalado (não o Chromium interno)
    }
  );

  client.onMessage((message) => {
    console.log("Mensagem recebida:", message.body);
  });
};

export const getQrCode = () => qrCodeBase64;
export const isWhatsappConnected = () => !!client;
