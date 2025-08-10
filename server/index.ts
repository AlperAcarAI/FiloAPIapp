 import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import morgan from "morgan";
import path from "path";
import fs from "fs";
import { createStream } from "rotating-file-stream";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Log dizinini oluştur (development için relative path)
const logDirectory = process.env.NODE_ENV === 'production' 
  ? '/var/www/filokiapi/FiloAPIapp/logs' 
  : './logs';

// Dizini recursive olarak oluştur
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

// Dönen log dosyası için bir stream oluştur
const accessLogStream = createStream('access.log', {
  interval: '1d', // her gün döndür
  path: logDirectory
});

// CORS ayarları - Production domain için
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://filokiapi.architectaiagency.com',
    'http://localhost:5000',
    'http://localhost:3000',
    'https://b0c96118-25cf-4b36-bd73-c26e525daf3c-00-b95p9o9piblg.spock.replit.dev'
  ];
  
  if (allowedOrigins.includes(origin || '') || !origin) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Morgan'ı hem konsola hem de dosyaya loglama yapacak şekilde ayarla
app.use(morgan('dev')); // Konsola loglama
app.use(morgan('combined', { stream: accessLogStream })); // Dosyaya loglama

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
