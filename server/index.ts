import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Domain filtering middleware - Sadece belirli URL'den gelen istekleri kabul et
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const host = req.headers.host;
  
  // İzin verilen domain
  const allowedDomain = 'architectaiagency';
  
  // Domain kontrolünü devre dışı bırakmak için DISABLE_DOMAIN_CHECK=true kullanın
  if (process.env.DISABLE_DOMAIN_CHECK === 'true') {
    console.log('[Domain Check] Disabled via environment variable');
    next();
    return;
  }
  
  // Sadece production ortamında domain kontrolü yap
  if (process.env.NODE_ENV === 'production') {
    // Debug için header'ları logla
    console.log('[Domain Check] Headers:', {
      origin: origin || 'none',
      referer: referer || 'none',
      host: host || 'none'
    });
    
    // Origin veya referer kontrolü
    const isAllowed = (origin && origin.includes(allowedDomain)) || 
                     (referer && referer.includes(allowedDomain)) ||
                     (host && host.includes(allowedDomain));
    
    if (!isAllowed) {
      const requestedUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      const requestSource = origin || referer || host || 'unknown';
      
      console.log('[Domain Check] Request blocked from:', requestSource);
      console.log('[Domain Check] Requested URL:', requestedUrl);
      
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: `Bu API sadece yetkili domainlerden erişilebilir. İstek yapılan URL: ${requestedUrl}. İzin verilen domain: ${allowedDomain}`,
        debug: {
          istekYapilanUrl: requestedUrl,
          istekKaynagi: requestSource,
          izinVerilenDomain: allowedDomain,
          headers: {
            origin: origin || 'none',
            referer: referer || 'none',
            host: host || 'none'
          }
        }
      });
    }
    
    console.log('[Domain Check] Request allowed');
  }
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

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
