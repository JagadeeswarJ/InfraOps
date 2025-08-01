import express, { Router } from "express";
import expressAsyncHandler from "express-async-handler";
import { onBoarding, verifyOTP, login } from "../controllers/auth.controller.js";


const authRoute: Router = express.Router();


authRoute.post("/register", expressAsyncHandler(onBoarding));
authRoute.post("/verify-otp", expressAsyncHandler(verifyOTP));
authRoute.post("/login", (req, res, next) => {
  console.log("Login route hit!");
  console.log("Request body:", req.body);
  next();
}, expressAsyncHandler(login));
export default authRoute;