import { Router } from "express"
import expressAsyncHandler from "express-async-handler";
import { supabase } from "../config/supabaseClient.ts"


const authRouter = Router();

authRouter.post("/login", expressAsyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const { data, error } = await supabase.from("users").insert({ email, password }).select("*");
    if (error) console.error(error)
    console.log("user login success ")
    res.json(data);
}));

authRouter.post("/register", expressAsyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    const { data, error } = await supabase.from("users").insert({ username, email, password }).select("*");
    if (error) console.error(error)
    console.log("user created ")
    res.json(data);
}));


export default authRouter;