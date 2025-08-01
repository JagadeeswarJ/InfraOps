import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { env } from '../config/env.config.js';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY!);

export async function callGemini({
  messages,
  context,
  imageBase64,
  mimeType = "image/jpeg",
}: {
  messages: { role: "user" | "model"; parts: any[] }[];
  context?: string;
  imageBase64?: string;
  mimeType?: string;
}) {
  const model = genAI.getGenerativeModel({
    model: imageBase64 ? "gemini-2.5-flash-lite" : "gemini-2.5-flash-lite",
  });

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];

  const parts = messages.map((m) => ({
    role: m.role,
    parts: m.parts,
  }));

  // If image is provided, convert to parts
  if (imageBase64) {
    parts.push({
      role: "user",
      parts: [
        {
          inlineData: {
            data: imageBase64,
            mimeType,
          },
        },
        { text: "Please analyze this image." },
      ],
    });
  }

  const result = await model.generateContent({
    contents: [
      ...(context
        ? [
            {
              role: "user",
              parts: [{ text: context }],
            },
          ]
        : []),
      ...parts,
    ],
    safetySettings,
  });

  const response = await result.response;
  return response.text();
}

export default {
  callGemini
};