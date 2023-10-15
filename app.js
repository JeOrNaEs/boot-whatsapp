import "dotenv/config";
import bot from "@bot-whatsapp/bot";
import { getDay } from "date-fns";
import QRPortalWeb from "@bot-whatsapp/portal";
import BaileysProvider from "@bot-whatsapp/provider/baileys";
import MockAdapter from "@bot-whatsapp/database/mock";

import chatgpt from "./services/openai/chatgpt.js";
import GoogleSheetService from "./services/sheets/index.js";

const googelSheet = new GoogleSheetService(
  "1rDDWdRcLmecRhDSepMZdJwxMIp8iOxZMjDKuh2dA6W8"
);

const GLOBAL_STATE = [];

const flowPrincipal = bot
  .addKeyword(["hola", "hi"])
  .addAnswer([
    `Bienvenidos a mi bot automatizado! 🚀`,
    `Desarrollado para contestar preguntas frecuentes`,
    `Te gustaria esta información ¿?`,
    `Escribe *Información basica*`,
  ]);

const flowMenu = bot
  .addKeyword("Información basica")
  .addAnswer([
    `Mi informacón personal es:`,
    `Nombres: Jerson Orlando`,
    `Apellidos: Navarrete Espinosa`,
    `Telefono: 3138331682`,
    `Dirección: Calle 142 a # 139 - 36`,
  ])
  .addAnswer(
    `Quieres saber algo de .Net?`,
    { capture: true },
    async (ctx, { gotoFlow, state }) => {
      const txt = ctx.body;
      const check = await chatgpt.completion(`
    Sobre .Net quieren saber lo siguiente:
    "
    ${["Que es?","Cuantos años tiene?"]}
    "
    El cliente quiere "${txt}"
    Basado en el menu y lo que quiere el cliente determinar (EXISTE, NO_EXISTE).
    La orden del cliente
    `);

      const getCheck = check.data.choices[0].text
        .trim()
        .replace("\n", "")
        .replace(".", "")
        .replace(" ", "");

      if (getCheck.includes("NO_EXISTE")) {
        return gotoFlow(flowEmpty);
      } else {
        state.update({pedido:ctx.body})
        return gotoFlow(flowPedido);
      }
    }
  );

const flowEmpty = bot
  .addKeyword(bot.EVENTS.ACTION)
  .addAnswer("No te he entendido!", null, async (_, { gotoFlow }) => {
    return gotoFlow(flowMenu);
  });

const flowPedido = bot
  .addKeyword(["pedir"], { sensitive: true })
  .addAnswer(
    "¿Cual es tu nombre?",
    { capture: true },
    async (ctx, { state }) => {
      state.update({ name: ctx.body });
    }
  )
  .addAnswer(
    "¿Alguna observacion?",
    { capture: true },
    async (ctx, { state }) => {
      state.update({ observaciones: ctx.body });
    }
  )
  .addAnswer(
    "Perfecto tu pedido estara listo en un aprox 20min",
    null,
    async (ctx, { state }) => {
        const currentState = state.getMyState();
      await googelSheet.saveOrder({
        fecha: new Date().toDateString(),
        telefono: ctx.from,
        pedido: currentState.pedido,
        nombre: currentState.name,
        observaciones: currentState.observaciones,
      });
    }
  );

const main = async () => {
  const adapterDB = new MockAdapter();
  const adapterFlow = bot.createFlow([
    flowPrincipal,
    flowMenu,
    flowPedido,
    flowEmpty,
  ]);
  const adapterProvider = bot.createProvider(BaileysProvider);

  bot.createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  });

  QRPortalWeb();
};

main();