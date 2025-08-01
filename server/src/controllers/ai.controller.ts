import { Request, Response } from "express";
import { callGemini } from "../utils/gemini.util.js";

export const testGemini = async (req: Request, res: Response): Promise<any> => {
    try {
        const { prompt, imageBase64, mimeType } = req.body;

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
            imageBase64,
            mimeType
        });
        // Parse Gemini's JSON response and log it
        let parsedResponse;
        try {
            parsedResponse = typeof response === "string" ? JSON.parse(response) : response;
        } catch (parseError) {
            console.error("Failed to parse Gemini response as JSON:", parseError);
            parsedResponse = response;
        }
        console.log("Gemini response:", parsedResponse);
        return res.status(200).json({
            success: true,
            prompt,
            response
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