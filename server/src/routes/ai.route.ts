import express, { Router } from "express";
import expressAsyncHandler from "express-async-handler";
import { 
    testGemini, 
    analyzeTicketImage, 
    suggestSolution, 
    categorizeTicket,
    findSimilarTickets,
    getAssignmentRecommendation
} from "../controllers/ai.controller.js";

const aiRoute: Router = express.Router();

aiRoute.post("/test-gemini", expressAsyncHandler(testGemini));

aiRoute.post("/analyze-image", expressAsyncHandler(analyzeTicketImage));
aiRoute.post("/suggest-solution", expressAsyncHandler(suggestSolution));
aiRoute.post("/categorize-ticket", expressAsyncHandler(categorizeTicket));
aiRoute.post("/find-similar", expressAsyncHandler(findSimilarTickets));
aiRoute.post("/assignment-recommendation", expressAsyncHandler(getAssignmentRecommendation));

export default aiRoute;