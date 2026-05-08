import { GoogleGenAI, Type } from "@google/genai";
import { LineData } from "../types";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY || "";
    if (!key) {
      console.warn("GEMINI_API_KEY is not defined. Analysis features will be disabled.");
    }
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
}

export async function analyzeImageMeasurements(
  imageDataUri: string,
  lines: LineData[]
) {
  const ai = getAI();
  const base64Data = imageDataUri.split(",")[1];
  const mimeType = imageDataUri.split(",")[0].split(":")[1].split(";")[0];

  const referenceLine = lines.find((l) => l.type === 'Reference (Known)');
  
  if (!referenceLine || !referenceLine.realLength) {
    throw new Error("A reference line with a known length is required for analysis.");
  }

  const linesInfo = lines.map(line => ({
    id: line.id,
    name: line.name,
    category: line.category,
    type: line.type,
    coords: line.coords,
    knownLength: line.realLength
  }));

  const prompt = `
    You are an expert photogrammetry and spatial analysis AI.
    I have provided an image and a list of measurement lines.
    
    REFERENCE LINE (Known Length):
    ${JSON.stringify(referenceLine)}
    
    TARGET LINES (To calculate):
    ${JSON.stringify(lines.filter(l => l.type !== 'Reference (Known)'))}

    OBJECTIVE:
    1. Estimate the 3D depth, focal length, and perspective of the image.
    2. Use the Green Reference Line (${referenceLine.realLength} units) to establish a baseline physical scale.
    3. Calculate the physical length of each target line.
    4. MUST account for:
       - Foreshortening: Lines pointing towards or away from the camera.
       - Parallax/Depth: The distance relative to the camera compared to the reference.
       - Perspective Distortion: Objects becoming smaller in the distance.
    5. Provide a 'reasoning' for each calculation (e.g. "Adjusted +12% for predicted Z-depth inclination").
    6. Provide a 'confidence' score (0-100) based on the image clarity and perspective geometry.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lines: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  calculatedLength: { type: Type.NUMBER },
                  confidence: { type: Type.NUMBER },
                  reasoning: { type: Type.STRING }
                },
                required: ["id", "calculatedLength"]
              }
            },
            summary: { type: Type.STRING },
            perspectiveAnalysis: { type: Type.STRING }
          },
          required: ["lines", "summary"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
}
