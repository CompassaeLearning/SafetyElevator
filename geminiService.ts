
import { GoogleGenAI, Type } from "@google/genai";
import { ControlLevel, Hazard, FloorData } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are the "Elevator Operator" for the Hierarchy of Controls Skyscraper.
You are helping users learn NEBOSH standards.

For a given hazard and floor level, generate:
1. An intro message welcoming the player to that floor.
2. EXACTLY 4 multiple-choice options.
3. One option MUST be a correct solution for the current level.
4. The other 3 options MUST be solutions that belong to DIFFERENT levels of the hierarchy.
5. Provide a short explanation for each option explaining why it belongs to its specific level.

Levels:
1: PPE
2: Administrative Controls
3: Engineering Controls
4: Substitution
5: Elimination

Ensure your output is strictly valid JSON.
`;

export const getFloorData = async (hazard: Hazard, level: ControlLevel): Promise<FloorData> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Hazard: ${hazard.title} (${hazard.description})
Current Level: ${level}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intro: { type: Type.STRING },
            choices: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  text: { type: Type.STRING },
                  level: { type: Type.INTEGER },
                  explanation: { type: Type.STRING }
                },
                required: ["id", "text", "level", "explanation"]
              }
            }
          },
          required: ["intro", "choices"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Error:", error);
    // Fallback data
    return {
      intro: "Let's find a solution for this floor.",
      choices: [
        { id: "1", text: "Wear safety goggles", level: 1, explanation: "PPE protects the eyes." },
        { id: "2", text: "Put up warning signs", level: 2, explanation: "Signs are administrative." },
        { id: "3", text: "Install a guard rail", level: 3, explanation: "Guards are engineering." },
        { id: "4", text: "Remove the machine", level: 5, explanation: "Removal is elimination." }
      ]
    };
  }
};

export const generateNewHazard = async (): Promise<Hazard> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Generate a single random industrial workplace hazard for a safety training game. Examples: leaky chemical drum, high-voltage panel, repetitive lifting, loud grinding machine. Provide a title and a brief description.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["title", "description"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    return {
      title: "Noisy Air Compressor",
      description: "A loud reciprocating air compressor in a poorly ventilated workshop room."
    };
  }
};
