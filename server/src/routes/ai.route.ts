import express, { Router } from "express";
import expressAsyncHandler from "express-async-handler";
import { testGemini } from "../controllers/ai.controller.ts";

const aiRoute: Router = express.Router();

aiRoute.post("/test-gemini", expressAsyncHandler(testGemini));

export default aiRoute;