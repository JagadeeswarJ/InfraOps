import express, { Request, Response } from "express";
import cors from "cors";
import authRoute from "./routes/auth.route.js";
import aiRoute from "./routes/ai.route.js";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.set("trust proxy", true);

app.get("/", (req: Request, res: Response) => {
  res.send({ message: "Server is working!" });
});

app.use("/auth", authRoute);
app.use("/ai", aiRoute);


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});