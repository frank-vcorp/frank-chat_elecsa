import * as dotenv from "dotenv";
dotenv.config({ path: "../apps/web/.env.local" });
dotenv.config({ path: "../apps/web/.env" });
import { getSofiaResponse } from "../apps/web/src/lib/aiProvider";

async function main() {
  const message = `6ES7214-1AG40-0XB0
6ES7315-2AH14-0AB0
6ES7321-1BL00-0AA0
6ES7223-1BH32-0XB0
6AV2123-2GB03-0AX0
6AV2123-3KB32-0AW0
cable THW 12 AWG`;

  const conversationId = "test-conv-" + Date.now();
  const phoneNumber = "521234567890";
  console.log("\n--- 🤖 SIMULADOR BATCH DE SOFÍA ---");
  console.log("Mensaje:\n", message);
  console.log("\n⏳ Sofía está pensando...\n");

  try {
    const response = await getSofiaResponse(
      message,
      conversationId,
      phoneNumber,
    );
    console.log("🤖 Sofía:\n\n" + response + "\n");
  } catch (error) {
    console.error("\n❌ Error:", error);
  }
}
main();
