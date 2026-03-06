 import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import morgan from "morgan";
import path from "path";
import fs from "fs";
import { createStream } from "rotating-file-stream";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializePolicyScheduler } from "./policy-scheduler";
import { loadTenantConfigs, tenantDbMiddleware } from "./tenant-context";

// Load tenant configurations from environment
loadTenantConfigs();

const app = express();

// Log dizini: LOG_FILE_PATH env varsa onu kullan, yoksa relative ./logs
const logDirectory = process.env.LOG_FILE_PATH || './logs';

// Dizini recursive olarak oluştur
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

// Dönen log dosyası için bir stream oluştur
const accessLogStream = createStream('access.log', {
  interval: '1d', // her gün döndür
  path: logDirectory
});

// CORS ayarlari - Tenant domainleri icin
const allowedOrigins = [
  'https://filokiapi.architectaiagency.com',
  'https://filodemoapi.dijiminds.com',
  'http://localhost:5000',
  'http://localhost:5001',
  'http://localhost:5002',
  'http://localhost:3000',
];
// CORS_EXTRA_ORIGINS env ile ek originler eklenebilir (virgul ile ayrilmis)
if (process.env.CORS_EXTRA_ORIGINS) {
  allowedOrigins.push(...process.env.CORS_EXTRA_ORIGINS.split(',').map(s => s.trim()));
}

app.use((req, res, next) => {
  const origin = req.headers.origin;

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

// Tenant DB middleware - domain'e gore dogru veritabanini secer
app.use(tenantDbMiddleware);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Morgan'ı hem konsola hem de dosyaya loglama yapacak şekilde ayarla
app.use(morgan('dev')); // Konsola loglama
app.use(morgan('combined', { stream: accessLogStream })); // Dosyaya loglama

(async () => {
  // ALWAYS register routes first, regardless of environment
  const server = await registerRoutes(app);

  // Initialize policy expiration notification scheduler
  if (app.get("env") === "production" || process.env.ENABLE_SCHEDULER === 'true') {
    initializePolicyScheduler();
    console.log('✅ Poliçe bildirim scheduler aktif');
  } else {
    console.log('⏸️  Poliçe bildirim scheduler pasif (development mode)');
    console.log('💡 Scheduler\'ı development\'ta aktif etmek için ENABLE_SCHEDULER=true kullanın');
  }

  // CRITICAL: Add API route protection BEFORE any catch-all routes
  // This must come BEFORE serveStatic/setupVite to prevent HTML responses
  app.use('/api/*', (req, res, next) => {
    console.log(`🔍 API Protection triggered for: ${req.method} ${req.originalUrl}`);
    console.log(`🔍 Environment: ${app.get("env")}`);
    console.log(`🔍 Headers: ${JSON.stringify(req.headers)}`);
    
    // Force JSON response for API routes that weren't handled
    res.status(404).json({
      success: false,
      error: "API_NOT_FOUND", 
      message: `API endpoint ${req.originalUrl} not found`,
      debug: {
        method: req.method,
        path: req.originalUrl,
        environment: app.get("env"),
        timestamp: new Date().toISOString()
      }
    });
  });

  // Setup static serving AFTER API routes are registered
  // This ensures API routes have priority over static file serving
  
  // Setup Vite in development, static serving in production
  if (app.get("env") === "development") {
    console.log("🔧 Development mode: Setting up Vite with HMR...");
    await setupVite(app, server);
  } else {
    console.log("🔧 Production mode: Serving static files...");
    serveStatic(app);
  }

  // Error handler MUST come AFTER all route registrations and static serving
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
