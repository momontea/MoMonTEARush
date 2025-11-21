import { GoogleGenAI, Type } from "@google/genai";
import { REWARD_TIERS } from "../constants";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface DrinkRecipe {
  name: string;
  description: string;
  ingredients: string[];
  vibe: string;
  tierName: string;
  reward: {
    discountCode: string;
    discountValue: string;
    validity: string;
  }
}

export const generateMoMonSpecial = async (score: number): Promise<DrinkRecipe> => {
  try {
    const model = 'gemini-2.5-flash';
    
    // Calculate reward tier strict logic
    let tier = REWARD_TIERS.BRONZE;
    if (score >= REWARD_TIERS.SILVER.minScore) tier = REWARD_TIERS.SILVER;
    if (score >= REWARD_TIERS.GOLD.minScore) tier = REWARD_TIERS.GOLD;
    if (score >= REWARD_TIERS.DIAMOND.minScore) tier = REWARD_TIERS.DIAMOND;

    const prompt = `
      Eres el Barista caótico, divertido y energético de la marca de Bubble Tea "MoMon Tea".
      Un jugador acaba de terminar una partida con Puntuación: ${score}.
      Alcanzó el nivel: ${tier.name}.
      
      El premio es EXACTAMENTE: ${tier.discount} (No cambies esto).
      
      Tu tarea:
      1. Inventa un nombre de bebida creativa y loca basada en el nivel (Bronce=Tranqui, Diamante=Legendaria). EN ESPAÑOL.
      2. Crea una descripción corta y emocionante (Hype). EN ESPAÑOL.
      3. Lista 3 ingredientes de fantasía. EN ESPAÑOL.
      4. Define la "Vibe" (Energía). EN ESPAÑOL.
      5. Genera un código de cupón que contenga "MOMON" y el nombre del nivel.
      6. La validez (validity) SIEMPRE debe ser "72 HORAS".
      
      Tono: Locutor de videojuego arcade, divertido, juvenil.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Nombre creativo de la bebida" },
            description: { type: Type.STRING, description: "Descripción corta y divertida" },
            ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
            vibe: { type: Type.STRING, description: "Nivel de energía" },
            tierName: { type: Type.STRING, description: "El nivel alcanzado" },
            reward: {
              type: Type.OBJECT,
              properties: {
                discountCode: { type: Type.STRING },
                discountValue: { type: Type.STRING },
                validity: { type: Type.STRING }
              },
              required: ["discountCode", "discountValue", "validity"]
            }
          },
          required: ["name", "description", "ingredients", "vibe", "tierName", "reward"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as DrinkRecipe;
    }
    
    throw new Error("No text returned from AI");

  } catch (error) {
    console.error("Error generating drink:", error);
    return {
      name: "Té Sin Conexión",
      description: "El wifi se fue, pero el sabor se queda.",
      ingredients: ["Ondas 4G", "Boba en Caché", "Leche Pixelada"],
      vibe: "Desconectado",
      tierName: "BRONCE",
      reward: {
        discountCode: "MOMON-OFFLINE",
        discountValue: "5% OFF",
        validity: "72 HORAS"
      }
    };
  }
};