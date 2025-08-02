import express, { Request, Response } from "express";
import cors from "cors";
import authRoute from "./routes/auth.route.js";
import aiRoute from "./routes/ai.route.js";
import communityRoute from "./routes/community.routes.js";
import ticketRoute from "./routes/ticket.routes.js";
import notificationRoute from "./routes/notification.routes.js";
import uploadRoute from "./routes/upload.routes.js";

const app = express();
const PORT = 3000;
app.use(cors());
// app.use("/api", , yourRoutes);

app.use(express.json({ limit: '10mb' }));
app.set("trust proxy", true);

// Add comprehensive request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const userAgent = req.get('User-Agent') || 'Unknown';
  const ip = req.ip || req.connection.remoteAddress || 'Unknown';
  
  console.log(`\n=== REQUEST START [${timestamp}] ===`);
  console.log(`${method} ${url}`);
  console.log(`IP: ${ip}`);
  console.log(`User-Agent: ${userAgent}`);
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
  }
  
  if (req.query && Object.keys(req.query).length > 0) {
    console.log('Query Params:', req.query);
  }
  
  if (req.params && Object.keys(req.params).length > 0) {
    console.log('Route Params:', req.params);
  }
  
  // Log response when it finishes
  const originalSend = res.send;
  res.send = function(data) {
    console.log(`Response Status: ${res.statusCode}`);
    if (data && typeof data === 'string' && data.length < 1000) {
      console.log('Response Data:', data);
    } else if (data) {
      console.log('Response Data: [Large response body]');
    }
    console.log(`=== REQUEST END [${new Date().toISOString()}] ===\n`);
    return originalSend.call(this, data);
  };
  
  next();
});

app.get("/", (req: Request, res: Response) => {
  res.send({ message: "Server is working!" });
});

app.use("/auth", authRoute);
app.use("/ai", aiRoute);
app.use("/api/communities", communityRoute);
app.use("/api/tickets", ticketRoute);
app.use("/api/notifications", notificationRoute);
app.use("/api/upload", uploadRoute);

app.use((err: any, req: Request, res: Response, next: any) => {
  const timestamp = new Date().toISOString();
  console.error(`\n=== ERROR [${timestamp}] ===`);
  console.error(`URL: ${req.method} ${req.originalUrl}`);
  console.error(`Error Message: ${err.message}`);
  console.error(`Stack Trace:`, err.stack);
  console.error(`=== ERROR END ===\n`);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
