import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { publicApi, backendApi, authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Code, Play, Database, Users, MapPin, Key, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ApiCenter() {
  const [searchTerm, setSearchTerm] = useState('');
  const [testResponse, setTestResponse] = useState<any>(null);
  const [testRequest, setTestRequest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('filoki-api-master-key-2025');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'test' | 'example'>('test');
  const { toast } = useToast();

  // Get all available endpoints
  const { data: endpoints = [] } = useQuery({
    queryKey: ['/api/endpoints'],
    queryFn: () => publicApi.getEndpoints()
  });

  // Get cities data for testing
  const { data: citiesData } = useQuery({
    queryKey: ['/api/getCities'],
    queryFn: () => publicApi.getCities({ limit: 10 })
  });

  // Get Swagger documentation
  const { data: swaggerDocs } = useQuery({
    queryKey: ['/api/docs'],
    queryFn: () => publicApi.getSwaggerDocs()
  });

  const getEndpointExample = (endpoint: any) => {
    const examples: Record<string, any> = {
      'getCities': {
        request: {
          method: 'GET',
          url: '/api/getCities',
          parameters: {
            limit: 10,
            offset: 0,
            search: 'İstanbul',
            sortBy: 'name',
            sortOrder: 'asc'
          }
        },
        response: {
          success: true,
          message: 'Şehirler başarıyla getirildi',
          data: [
            { id: 1, name: 'İstanbul', countryId: 1 },
            { id: 2, name: 'Ankara', countryId: 1 }
          ],
          pagination: { total: 81, limit: 10, offset: 0 }
        }
      },
      'getAssets': {
        request: {
          method: 'GET',
          url: '/api/secure/assets',
          headers: { 'X-API-Key': 'filoki-api-master-key-2025' },
          parameters: {
            limit: 10,
            offset: 0,
            search: '34ABC',
            companyId: 1,
            workAreaId: 1,
            activeOnly: true
          }
        },
        response: {
          success: true,
          message: 'Varlıklar başarıyla getirildi',
          data: [
            {
              id: 1,
              licensePlate: '34ABC123',
              carBrandId: 1,
              carModelId: 1,
              year: 2022,
              companyId: 1,
              workAreaId: 1,
              isActive: true
            }
          ]
        }
      },
      'createAsset': {
        request: {
          method: 'POST',
          url: '/api/secure/assets',
          headers: { 'X-API-Key': 'filoki-api-master-key-2025' },
          body: {
            licensePlate: '34NEW123',
            carBrandId: 1,
            carModelId: 1,
            year: 2024,
            companyId: 1,
            workAreaId: 1,
            ownershipTypeId: 1
          }
        },
        response: {
          success: true,
          message: 'Varlık başarıyla oluşturuldu',
          data: { id: 21, licensePlate: '34NEW123' }
        }
      },
      'getPersonnel': {
        request: {
          method: 'GET',
          url: '/api/secure/personnel',
          headers: { 'X-API-Key': 'filoki-api-master-key-2025' },
          parameters: {
            limit: 10,
            search: 'Ahmet',
            companyId: 1,
            positionId: 1,
            activeOnly: true
          }
        },
        response: {
          success: true,
          message: 'Personel listesi başarıyla getirildi',
          data: [
            {
              id: 1,
              firstName: 'Ahmet',
              lastName: 'Yılmaz',
              email: 'ahmet@test.com',
              phone: '+905551234567',
              positionId: 1,
              companyId: 1,
              isActive: true
            }
          ]
        }
      },
      'login': {
        request: {
          method: 'POST',
          url: '/api/auth/login',
          body: {
            email: 'admin@filoki.com',
            password: 'Acar'
          }
        },
        response: {
          success: true,
          message: 'Giriş başarılı',
          data: {
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            refreshToken: 'refresh_token_here',
            user: {
              id: 1,
              email: 'admin@filoki.com',
              accessLevel: 'CORPORATE'
            }
          }
        }
      },
      'getFuelRecords': {
        request: {
          method: 'GET',
          url: '/api/secure/fuel-records',
          headers: { 'X-API-Key': 'filoki-api-master-key-2025' },
          parameters: {
            limit: 10,
            assetId: 1,
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            fuelType: 'DIESEL'
          }
        },
        response: {
          success: true,
          message: 'Yakıt kayıtları başarıyla getirildi',
          data: [
            {
              id: 1,
              assetId: 1,
              personnelId: 1,
              fuelType: 'DIESEL',
              liters: 65.5,
              pricePerLiter: 28.50,
              totalCost: 1866.75,
              stationName: 'Petrol Ofisi Levent',
              fuelDate: '2024-12-01T08:30:00Z'
            }
          ]
        }
      }
    };

    return examples[endpoint.name] || {
      request: {
        method: endpoint.method,
        url: endpoint.path,
        headers: endpoint.path.includes('/secure/') ? { 'X-API-Key': 'filoki-api-master-key-2025' } : undefined,
        parameters: endpoint.method === 'GET' ? { limit: 10, offset: 0 } : undefined,
        body: endpoint.method !== 'GET' ? { /* request_body */ } : undefined
      },
      response: {
        success: true,
        message: 'İşlem başarılı',
        data: {}
      }
    };
  };

  const validateApiKey = (endpointPath: string): boolean => {
    // Check if endpoint requires API key
    const requiresApiKey = endpointPath.includes('/secure/') || endpointPath.includes('/admin/') || endpointPath.includes('/backend/');
    
    if (requiresApiKey && !apiKey.trim()) {
      toast({
        title: "API Anahtarı Gerekli",
        description: "Bu endpoint için API anahtarı gereklidir",
        variant: "destructive"
      });
      setShowApiKeyInput(true);
      return false;
    }
    
    return true;
  };

  const handleTestEndpoint = async (endpoint: string, method: string) => {
    // Validate API key before making request
    if (!validateApiKey(endpoint)) {
      return;
    }

    setIsLoading(true);
    
    // Prepare request object for display
    const requestData: any = {
      method: method,
      url: endpoint,
      headers: {
        'Content-Type': 'application/json'
      },
      timestamp: new Date().toISOString()
    };

    // Add API key for secure endpoints
    if (endpoint.includes('/secure/') || endpoint.includes('/admin/') || endpoint.includes('/backend/')) {
      requestData.headers['X-API-Key'] = apiKey;
    }

    // Add parameters for specific endpoints
    if (endpoint === '/api/getCities') {
      requestData.parameters = { limit: 5, offset: 0 };
    }

    setTestRequest(requestData);

    try {
      let response;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Add API key for secure endpoints
      if (endpoint.includes('/secure/') || endpoint.includes('/admin/') || endpoint.includes('/backend/')) {
        headers['X-API-Key'] = apiKey;
      }
      
      const startTime = Date.now();
      
      switch (endpoint) {
        case '/api/getCities':
          response = await publicApi.getCities({ limit: 5 });
          break;
        case '/api/docs':
          response = await publicApi.getSwaggerDocs();
          break;
        case '/api/endpoints':
          response = await publicApi.getEndpoints();
          break;
        default:
          // For other endpoints, make a generic fetch request with proper headers
          const fetchOptions: RequestInit = {
            method: method,
            headers: headers
          };
          
          const fetchResponse = await fetch(endpoint, fetchOptions);
          response = await fetchResponse.json();
          
          // Check if response indicates API key error
          if (response.error === 'API_KEY_MISSING' || response.error === 'API_KEY_INVALID') {
            toast({
              title: "API Anahtarı Hatası",
              description: "Geçersiz veya eksik API anahtarı",
              variant: "destructive"
            });
            setShowApiKeyInput(true);
            setTestResponse({
              ...response,
              status: fetchResponse.status,
              responseTime: `${Date.now() - startTime}ms`,
              timestamp: new Date().toISOString()
            });
            return;
          }
      }
      
      // Add metadata to response
      const responseWithMeta = {
        ...response,
        _metadata: {
          status: 200,
          responseTime: `${Date.now() - startTime}ms`,
          timestamp: new Date().toISOString(),
          endpoint: endpoint
        }
      };
      
      setTestResponse(responseWithMeta);
      toast({
        title: "Test Başarılı",
        description: `${method} ${endpoint} başarıyla çalıştırıldı`
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      const errorResponse = {
        error: errorMessage,
        _metadata: {
          status: 'error',
          responseTime: '0ms',
          timestamp: new Date().toISOString(),
          endpoint: endpoint
        }
      };
      setTestResponse(errorResponse);
      toast({
        title: "Test Başarısız",
        description: `${endpoint} test edilirken hata oluştu: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEndpoints = endpoints.filter(endpoint =>
    endpoint.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
    endpoint.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-blue-100 text-blue-800';
      case 'POST': return 'bg-green-100 text-green-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Center</h1>
          <p className="text-gray-600 mt-2">Explore and test FiloApi endpoints</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
            className={apiKey ? 'border-green-500 text-green-700' : 'border-red-500 text-red-700'}
          >
            <Key className="w-4 h-4 mr-2" />
            API Key {apiKey ? '✓' : '✗'}
          </Button>
          <Button variant="outline" onClick={() => window.open('/api/docs', '_blank')}>
            <Code className="w-4 h-4 mr-2" />
            Swagger Docs
          </Button>
        </div>
      </div>

      {/* API Key Input Section */}
      {showApiKeyInput && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Key className="w-5 h-5 mr-2" />
              API Anahtarı Ayarları
            </CardTitle>
            <CardDescription>
              Güvenli endpoint'leri test etmek için API anahtarınızı girin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="API Anahtarınızı girin..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={() => setShowApiKeyInput(false)}
                variant={apiKey ? "default" : "outline"}
              >
                {apiKey ? 'Kaydet' : 'İptal'}
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Varsayılan:</strong> filoki-api-master-key-2025
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4" />
            <Input
              placeholder="Search endpoints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="grid gap-4">
            {filteredEndpoints.map((endpoint) => {
              const example = getEndpointExample(endpoint);
              return (
                <Card key={endpoint.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge className={getMethodColor(endpoint.method)}>
                          {endpoint.method}
                        </Badge>
                        <code className="text-sm font-mono">{endpoint.path}</code>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(endpoint.status)}>
                          {endpoint.status}
                        </Badge>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Code className="w-3 h-3 mr-1" />
                              JSON
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                            <DialogHeader>
                              <DialogTitle>{endpoint.name} - JSON Örnekleri</DialogTitle>
                              <DialogDescription>
                                İstek ve cevap formatları
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <h3 className="text-lg font-semibold mb-2">İstek (Request)</h3>
                                <div className="bg-gray-50 p-4 rounded-md">
                                  <pre className="text-sm overflow-x-auto">
                                    {JSON.stringify(example.request, null, 2)}
                                  </pre>
                                </div>
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold mb-2">Cevap (Response)</h3>
                                <div className="bg-gray-50 p-4 rounded-md">
                                  <pre className="text-sm overflow-x-auto">
                                    {JSON.stringify(example.response, null, 2)}
                                  </pre>
                                </div>
                              </div>
                              {example.request.parameters && (
                                <div>
                                  <h3 className="text-lg font-semibold mb-2">Parametreler</h3>
                                  <div className="bg-blue-50 p-4 rounded-md">
                                    <pre className="text-sm overflow-x-auto">
                                      {JSON.stringify(example.request.parameters, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button 
                          size="sm" 
                          onClick={() => {
                            if (expandedEndpoint === endpoint.path) {
                              setExpandedEndpoint(null);
                            } else {
                              setExpandedEndpoint(endpoint.path);
                              setActiveTab('test');
                            }
                          }}
                          variant={expandedEndpoint === endpoint.path ? "default" : "outline"}
                        >
                          <Code className="w-3 h-3 mr-1" />
                          {expandedEndpoint === endpoint.id ? 'Kapat' : 'Detay'}
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{endpoint.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-3">{endpoint.description}</CardDescription>
                    
                    {/* Show parameters inline */}
                    {example.request.parameters && (
                      <div className="mb-3">
                        <h4 className="text-sm font-semibold mb-2">Yaygın Parametreler:</h4>
                        <div className="flex flex-wrap gap-2">
                          {Object.keys(example.request.parameters).map((param) => (
                            <Badge key={param} variant="outline" className="text-xs">
                              {param}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Show headers if API key required */}
                    {example.request.headers && (
                      <div className="mb-3">
                        <h4 className="text-sm font-semibold mb-2">Gerekli Headers:</h4>
                        <div className="flex flex-wrap gap-2">
                          {Object.keys(example.request.headers).map((header) => (
                            <Badge key={header} variant="outline" className="text-xs bg-red-50">
                              {header}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* API Key Status Indicator */}
                    {(endpoint.path.includes('/secure/') || endpoint.path.includes('/admin/') || endpoint.path.includes('/backend/')) && (
                      <div className="mb-3">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          <span className="text-sm font-semibold">Güvenlik Durumu:</span>
                          {apiKey ? (
                            <Badge className="bg-green-100 text-green-800">API Anahtarı Mevcut</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">API Anahtarı Gerekli</Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>

                  {/* Expanded Details Section */}
                  {expandedEndpoint === endpoint.path && (
                    <CardContent className="border-t bg-gray-50 dark:bg-gray-900">
                      <div className="space-y-4">
                        {/* Tab Navigation */}
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant={activeTab === 'test' ? 'default' : 'outline'}
                            onClick={() => setActiveTab('test')}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Test API
                          </Button>
                          <Button
                            size="sm"
                            variant={activeTab === 'example' ? 'default' : 'outline'}
                            onClick={() => setActiveTab('example')}
                          >
                            <Code className="w-4 h-4 mr-2" />
                            JSON Örnekleri
                          </Button>
                        </div>

                        {/* Test Tab */}
                        {activeTab === 'test' && (
                          <div className="space-y-4">
                            {/* API Key Warning for secure endpoints */}
                            {(endpoint.path.includes('/secure/') || endpoint.path.includes('/backend/')) && !apiKey && (
                              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                <div className="flex items-center gap-2">
                                  <Shield className="w-4 h-4 text-yellow-600" />
                                  <span className="text-sm text-yellow-700">
                                    Bu endpoint API anahtarı gerektirir. Lütfen yukarıdaki "API Key" butonuna tıklayarak anahtarınızı girin.
                                  </span>
                                </div>
                              </div>
                            )}

                            <Button 
                              onClick={() => handleTestEndpoint(endpoint.path, endpoint.method)}
                              disabled={isLoading || endpoint.status !== 'active'}
                              className="w-full"
                            >
                              {isLoading ? 'Test Ediliyor...' : `${endpoint.method} ${endpoint.path} Test Et`}
                            </Button>

                            {/* Show Request and Response */}
                            {(testRequest || testResponse) && (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {testRequest && (
                                  <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                      <Code className="w-4 h-4" />
                                      Gönderilen İstek (Request)
                                    </Label>
                                    <div className="relative">
                                      <Textarea
                                        value={JSON.stringify(testRequest, null, 2)}
                                        readOnly
                                        className="h-48 font-mono text-sm bg-blue-50 border-blue-200"
                                      />
                                      <Badge className="absolute top-2 right-2 bg-blue-100 text-blue-800">
                                        REQUEST
                                      </Badge>
                                    </div>
                                  </div>
                                )}

                                {testResponse && (
                                  <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                      <Database className="w-4 h-4" />
                                      Alınan Cevap (Response)
                                    </Label>
                                    <div className="relative">
                                      <Textarea
                                        value={JSON.stringify(testResponse, null, 2)}
                                        readOnly
                                        className={`h-48 font-mono text-sm ${
                                          testResponse.error ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                                        }`}
                                      />
                                      <Badge className={`absolute top-2 right-2 ${
                                        testResponse.error 
                                          ? 'bg-red-100 text-red-800' 
                                          : 'bg-green-100 text-green-800'
                                      }`}>
                                        {testResponse.error ? 'ERROR' : 'SUCCESS'}
                                      </Badge>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Response Metadata */}
                            {testResponse?._metadata && (
                              <div className="p-3 bg-gray-100 border rounded-md">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-medium">Detaylar:</span>
                                  <div className="flex gap-4">
                                    <span>Durum: <code>{testResponse._metadata.status}</code></span>
                                    <span>Süre: <code>{testResponse._metadata.responseTime}</code></span>
                                    <span>Zaman: <code>{new Date(testResponse._metadata.timestamp).toLocaleTimeString('tr-TR')}</code></span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Example Tab */}
                        {activeTab === 'example' && (
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-lg font-semibold mb-2">İstek (Request)</h3>
                              <div className="bg-gray-100 p-4 rounded-md">
                                <pre className="text-sm overflow-x-auto">
                                  {JSON.stringify(example.request, null, 2)}
                                </pre>
                              </div>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold mb-2">Cevap (Response)</h3>
                              <div className="bg-gray-100 p-4 rounded-md">
                                <pre className="text-sm overflow-x-auto">
                                  {JSON.stringify(example.response, null, 2)}
                                </pre>
                              </div>
                            </div>
                            {example.request.parameters && (
                              <div>
                                <h3 className="text-lg font-semibold mb-2">Parametreler</h3>
                                <div className="bg-blue-50 p-4 rounded-md">
                                  <pre className="text-sm overflow-x-auto">
                                    {JSON.stringify(example.request.parameters, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
      </div>
    </div>
  );
}
