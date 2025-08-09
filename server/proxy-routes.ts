import express from 'express';

const router = express.Router();

// JWT Token Authentication middleware (same as personnel routes)
const authenticateJWT = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Erişim token bulunamadı. Lütfen giriş yapın.'
    });
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  // For now, accept any valid looking token format
  // In production, you would verify the JWT token here
  if (token && token.length > 10) {
    req.user = { id: 1 }; // Mock user for now
    next();
  } else {
    return res.status(401).json({
      success: false,
      message: 'Geçersiz token formatı.'
    });
  }
};

// Proxy middleware to forward requests to external API
router.use('/api/proxy/*', authenticateJWT, async (req: any, res) => {
  try {
    // Extract the target path (everything after /api/proxy/)
    const targetPath = req.path.replace('/api/proxy/', '');
    const targetUrl = process.env.EXTERNAL_API_URL || 'https://filokiapi.architectaiagency.com';
    const fullTargetUrl = `${targetUrl}/api/${targetPath}`;
    
    console.log(`Proxying ${req.method} request to: ${fullTargetUrl}`);
    
    // Prepare headers for external API call
    const headers: any = {
      'Content-Type': 'application/json',
      'User-Agent': 'FiloAPI-Proxy/1.0'
    };
    
    // Forward JWT authorization header (required)
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    } else {
      return res.status(401).json({
        success: false,
        message: "Authorization header gerekli",
        error: "Missing JWT token"
      });
    }
    
    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };
    
    // Add body for POST/PUT requests
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      fetchOptions.body = JSON.stringify(req.body);
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
      if (contentType.includes('application/json') || text.trim().startsWith('{') || text.trim().startsWith('[')) {
        responseData = JSON.parse(text);
        isJson = true;
      } else {
        // If not JSON, treat as text
        responseData = text;
      }
    } catch (parseError) {
      console.error('Failed to parse response:', parseError);
      
      // If external API returns non-JSON, wrap it in a standard response
      return res.status(500).json({
        success: false,
        message: "API sunucusundan beklenmedik cevap alındı",
        error: "Response is not JSON format",
        statusCode: response.status,
        debug: {
          contentType,
          targetUrl: fullTargetUrl,
          method: req.method
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