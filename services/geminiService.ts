
import { GoogleGenAI, Type } from "@google/genai";
import { REWARD_TIERS } from "../constants";

// Initialize Gemini Client
// Using process.env.API_KEY based on vite.config.ts defines
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
    if (!process.env.API_KEY) {
        console.warn("API Key is missing. Using offline mode.");
        throw new Error("Missing API Key");
    }

    const model = 'gemini-2.5-flash';
    
    // 1. DETERMINISTIC TIER CALCULATION (Logic, not AI)
    let tier = REWARD_TIERS.NOVICE;
    
    if (score >= REWARD_TIERS.DIAMOND.minScore) {
        tier = REWARD_TIERS.DIAMOND;
    } else if (score >= REWARD_TIERS.GOLD.minScore) {
        tier = REWARD_TIERS.GOLD;
    } else if (score >= REWARD_TIERS.SILVER.minScore) {
        tier = REWARD_TIERS.SILVER;
    } else if (score >= REWARD_TIERS.BRONZE.minScore) {
        tier = REWARD_TIERS.BRONZE;
    }

    // 2. FORCE EXACT REWARD STRING
    const forcedRewardValue = tier.discount; // "5%", "10%", "20%", "BEBIDA GRATIS" or "0%"
    
    const prompt = `
      Eres la API de recompensas de "MoMon Tea".
      
      DATOS DEL JUGADOR:
      - Puntuación: ${score}
      - Nivel: ${tier.name}
      - PREMIO OBLIGATORIO: "${forcedRewardValue}"

      TU TAREA (Output JSON only):
      1. "name": Nombre creativo de bebida (Español).
      2. "description": Descripción corta (Español).
      3. "ingredients": 3 ingredientes de fantasía.
      4. "vibe": Una palabra de energía.
      5. "tierName": DEBE SER EXACTAMENTE: "${tier.name}".
      6. "reward": Objeto con:
         - "discountCode": Genera un código único tipo MOMON-${tier.name}-XYZ. (Si el premio es 0%, pon "SIGUE-JUGANDO").
         - "discountValue": DEBE SER EXACTAMENTE: "${forcedRewardValue}". (NO LO CAMBIES NI LO RECALCULES).
         - "validity": "72 HORAS".

      SI LA PUNTUACIÓN ES MENOR A 3500, EL PREMIO ES "0%".
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
            vibe: { type: Type.STRING },
            tierName: { type: Type.STRING },
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
      const data = JSON.parse(response.text) as DrinkRecipe;
      // DOUBLE CHECK SAFETY NET: Force the reward value again in case AI hallucinated
      data.reward.discountValue = forcedRewardValue;
      data.tierName = tier.name;
      return data;
    }
    
    throw new Error("No text returned from AI");

  } catch (error) {
    console.error("Error generating drink:", error);
    // Fallback deterministic logic
    let fallbackTier = REWARD_TIERS.NOVICE;
    if (score >= 3500) fallbackTier = REWARD_TIERS.BRONZE;
    if (score >= 7500) fallbackTier = REWARD_TIERS.SILVER;
    if (score >= 10500) fallbackTier = REWARD_TIERS.GOLD;
    if (score >= 15000) fallbackTier = REWARD_TIERS.DIAMOND;

    return {
      name: "Té de Emergencia",
      description: "La IA está tomando una siesta, pero tu premio es real.",
      ingredients: ["Datos", "Wifi", "Boba"],
      vibe: "Offline",
      tierName: fallbackTier.name,
      reward: {
        discountCode: `MOMON-${fallbackTier.name}-ERR`,
        discountValue: fallbackTier.discount,
        validity: "72 HORAS"
      }
    };
  }
};
