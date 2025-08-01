import { Request, Response } from "express";
import { callGemini } from "../utils/gemini.util.js";

export const testGemini = async (req: Request, res: Response): Promise<any> => {
    try {
        const { prompt, context, imageBase64, mimeType } = req.body;

        // Validate required fields
        if (!prompt) {
            return res.status(400).json({
                error: "Missing required field: prompt"
            });
        }

        // Prepare messages array
        const messages = [
            {
                role: "user" as const,
                parts: [{ text: prompt }]
            }
        ];

        // Call Gemini
        const response = await callGemini({
            messages,
            context,
            imageBase64,
            mimeType
        });

        return res.status(200).json({
            success: true,
            prompt,
            response,
            context: context || null,
            hasImage: !!imageBase64
        });

    } catch (error) {
        console.error("Gemini test error:", error);
        return res.status(500).json({
            error: "Internal server error during Gemini test",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

export default {
    testGemini
};