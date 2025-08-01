import express, { Router } from "express";
import expressAsyncHandler from "express-async-handler";
import { onBoarding } from "../controllers/auth.controller.js";


const authRoute: Router = express.Router();


authRoute.post("/register", expressAsyncHandler(onBoarding));

export default authRoute;