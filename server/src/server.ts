import express, { Request, Response } from "express";
import cors from "cors";
import authRoute from "./routes/auth.route.ts";
import aiRoute from "./routes/ai.route.ts";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.set("trust proxy", true);

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Request body:', req.body);
  next();
});

app.get("/", (req: Request, res: Response) => {
  res.send({ message: "Server is working!" });
});

app.use("/auth", authRoute);
app.use("/ai", aiRoute);

app.use((err: any, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
