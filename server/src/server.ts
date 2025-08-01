import express, { Request, Response } from "express";
import dotenv from 'dotenv';
dotenv.config();
import axios from "axios";
import cors from "cors";
import authRouter from "./routes/auth.js";

const app = express();
const url = "https://bitnap-server.onrender.com/"
const interval = 1000 * 60 * 10; // 5 minutes in milliseconds
app.use(express.json());
app.use(cors());
app.set("trust proxy", true);

function pingServer() {
    axios
        .get(url + "/u-awake")
        .then((response) => {
            console.log("website reloded");
        })
        .catch((error) => {
            console.error(`Error : ${error.message}`);
        });
}
setInterval(pingServer, interval);

app.use("/auth", authRouter);

app.get("/", (req: Request, res: Response) => {
    res.send({ message: "Server working!" });
});

app.get("/u-awake", (req: Request, res: Response) => {
    res.send({ message: "Server is awake!" });
});

app.listen(3000, () => {
    console.log(`Server is running on port 3000`);
});
