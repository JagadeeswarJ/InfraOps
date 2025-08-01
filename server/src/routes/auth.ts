import { Router } from "express"
import expressAsyncHandler from "express-async-handler";
import { firestore } from "../configs/firestoreClient.js"


const authRouter = Router();

authRouter.post("/login", expressAsyncHandler(async (req, res) => {
    const { email, password } = req.body;

    try {
        const userRef = await firestore.collection("users").add({ email, password });
        const userData = await userRef.get();
        const data = { id: userData.id, ...userData.data() };
        console.log("user login success ");
        res.json([data]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to login user" });
    }
}));

authRouter.post("/register", expressAsyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const userRef = await firestore.collection("users").add({ username, email, password });
        const userData = await userRef.get();
        const data = { id: userData.id, ...userData.data() };
        console.log("user created ");
        res.json([data]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create user" });
    }
}));


export default authRouter;