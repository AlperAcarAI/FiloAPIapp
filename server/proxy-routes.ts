import express from 'express';

const router = express.Router();

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-development-only';

// JWT Token Authentication middleware with proper verification
const authenticateJWT = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Erişim token bulunamadı. Lütfen giriş yapın.'
    });
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  try {
    // Verify JWT token and extract user ID
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Geçersiz token formatı.'
    });
  }
};

// Conditional Authentication - Skip auth for specific NO AUTH endpoints
const conditionalAuth = (req: any, res: any, next: any) => {
  const path = req.path;
  
  // NO AUTH endpoints - Bypass authentication
  const noAuthEndpoints = [
    /^\/documents\/main-doc-types$/,           // GET /documents/main-doc-types
    /^\/documents\/types\/\d+$/,               // GET /documents/types/:id (numeric ID)
  ];
  
  // Check if current path matches any NO AUTH endpoint
  const isNoAuthEndpoint = noAuthEndpoints.some(pattern => pattern.test(path));
  
  if (isNoAuthEndpoint && req.method === 'GET') {
    console.log(`⚠️ NO AUTH endpoint detected: ${req.method} ${path} - Bypassing authentication`);
    return next(); // Skip authentication
  }
  
  // For all other endpoints, require authentication
  return authenticateJWT(req, res, next);
};

// Proxy middleware to forward requests to external API  
router.all('/*', conditionalAuth, async (req: any, res) => {
  try {
    // req.path should now be the remainder after /api/proxy/ is stripped  
    const originalPath = req.path;
    console.log(`Debug: Original path: ${originalPath}, Extracted targetPath: '${originalPath}'`);
    
    // Map proxy paths to actual API endpoints
    let targetPath = originalPath;
    
    // Special mappings for specific endpoints
    if (originalPath.startsWith('/secure/penalties')) {
      // Map /secure/penalties to /penalties (remove secure prefix)
      targetPath = originalPath.replace('/secure/penalties', '/penalties');
      console.log(`Mapped secure penalties path: ${originalPath} -> ${targetPath}`);
    } else if (originalPath.startsWith('/secure/')) {
      console.log(`Keeping secure prefix for: ${originalPath}`);
      targetPath = originalPath; // Keep the full /secure/ prefix
    }
    
    // Use localhost for development, production URL for production
    // Check both NODE_ENV and development conditions
    const isProduction = process.env.NODE_ENV === 'production' || process.env.REPLIT_DEPLOYMENT;
    const defaultUrl = isProduction
      ? 'http://localhost:5000'  // Production'da da localhost kullan (aynı sunucuda)
      : 'http://localhost:5000';
    const targetUrl = process.env.EXTERNAL_API_URL || defaultUrl;
    
    console.log(`Environment check - NODE_ENV: ${process.env.NODE_ENV}, isProduction: ${isProduction}, targetUrl: ${targetUrl}`);
    
    // Construct target URL properly
    const cleanTargetUrl = targetUrl.replace(/\/$/, ''); // Remove trailing slash
    const cleanPath = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
    const fullTargetUrl = `${cleanTargetUrl}/api${cleanPath}`;
    
    console.log(`Proxying ${req.method} request to: ${fullTargetUrl}`);
    
    // Prepare headers for external API call
    const headers: any = {
      'Content-Type': 'application/json',
      'User-Agent': 'FiloAPI-Proxy/1.0'
    };
    
    // Forward JWT authorization header (optional for NO AUTH endpoints)
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    } else if (req.user && req.user.id) {
      // If user is authenticated but authorization header is missing, add it from req.user
      // This shouldn't happen, but we keep it as a fallback
      console.log('Warning: User authenticated but no Authorization header');
    }
    // For NO AUTH endpoints, no authorization header is needed
    
    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };
    
    // Add body for POST/PUT requests
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      let bodyData = req.body;
      
      // For document creation requests, inject uploadedBy from JWT token
      if (targetPath === '/documents' && req.method === 'POST') {
        bodyData = {
          ...req.body,
          uploadedBy: req.user.id
        };
        console.log(`Injected uploadedBy: ${req.user.id} for document creation`);
      }
      
      fetchOptions.body = JSON.stringify(bodyData);
    }
    
    // Add query parameters
    const url = new URL(fullTargetUrl);
    Object.keys(req.query).forEach(key => {
      url.searchParams.append(key, req.query[key] as string);
    });
    
    // Make the external API call
    const response = await fetch(url.toString(), fetchOptions);
    
    console.log(`External API responded with status: ${response.status}`);
    
    // Check content type
    const contentType = response.headers.get('content-type') || '';
    
    let responseData: any;
    let isJson = false;
    
    // Try to parse as JSON first
    try {
      const text = await response.text();
      console.log(`Response text preview: ${text.substring(0, 200)}...`);
      
      if (contentType.includes('application/json') || text.trim().startsWith('{') || text.trim().startsWith('[')) {
        responseData = JSON.parse(text);
        isJson = true;
      } else {
        // If not JSON, treat as text/HTML
        console.error('Non-JSON response received:', {
          contentType,
          statusCode: response.status,
          textPreview: text.substring(0, 500)
        });
        
        return res.status(400).json({
          success: false,
          message: "Çalışma alanı ataması yapılamadı - API endpoint hatası",
          error: "API_ENDPOINT_ERROR",
          details: "External API returned HTML instead of JSON. Check endpoint URL or authentication.",
          debug: {
            contentType,
            targetUrl: fullTargetUrl,
            statusCode: response.status,
            responsePreview: text.substring(0, 200)
          }
        });
      }
    } catch (parseError) {
      console.error('Failed to parse response:', parseError);
      
      return res.status(500).json({
        success: false,
        message: "API sunucusundan beklenmedik cevap alındı",
        error: "Response is not JSON format",
        statusCode: response.status,
        debug: {
          contentType,
          targetUrl: fullTargetUrl,
          method: req.method,
          parseError: parseError instanceof Error ? parseError.message : "Unknown error"
        }
      });
    }
    
    // Set response status
    res.status(response.status);
    
    // Forward response headers if needed
    const headersToForward = ['content-type', 'cache-control', 'etag'];
    headersToForward.forEach(header => {
      const headerValue = response.headers.get(header);
      if (headerValue) {
        res.setHeader(header, headerValue);
      }
    });
    
    // Send the response
    if (isJson) {
      res.json(responseData);
    } else {
      // For non-JSON responses, wrap them in a standard format
      res.json({
        success: response.ok,
        message: response.ok ? "Başarılı" : "Hata oluştu",
        data: responseData,
        statusCode: response.status,
        contentType
      });
    }
    
  } catch (error) {
    console.error('Proxy error:', error);
    
    res.status(500).json({
      success: false,
      message: "Proxy sunucusunda hata oluştu",
      error: error instanceof Error ? error.message : "Unknown error",
      debug: {
        targetPath: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      }
    });
  }
});

export default router;
