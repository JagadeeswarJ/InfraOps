import { Router } from "express"
import { supabase } from "../config/supabaseClient.ts"
import expressAsyncHandler from "express-async-handler";
import { todo } from "node:test";

const todosRouter = Router();

// basic CURD operations 
todosRouter.get("/", expressAsyncHandler(async (req, res) => {
    const dbRes = await supabase.from("todos").select("*");
    if (dbRes.error) {
        console.error("Supabase Error:", dbRes.error);
        res.status(500).json({ error: dbRes.error.message });
    }
    else {
        res.json(dbRes.data);
    }
}));

todosRouter.post("/", expressAsyncHandler(async (req, res) => {
    const { title } = req.body;
    if (!title) {
        res.status(400).json({ error: "Title is required" });
    }
    else {
        const { data, error } = await supabase.from("todos").insert([{ title }]).select("*");
        res.json(data);
    }
}));

todosRouter.put("/:id", expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, is_done } = req.body;
    const { data, error } = await supabase.from("todos").update({ title, is_done }).eq("id", id).select("*");
    if (error) res.status(500).json({ error: error.message });
    else res.json(data);
}));


todosRouter.delete("/:id", expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from("todos").delete().eq("id", id);
    if (error) res.status(500).json({ error: error.message });
    else res.status(200).send({message:"Data deleted successfully"});
}));



export default todosRouter;