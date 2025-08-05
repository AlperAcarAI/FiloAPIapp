import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Play, 
  FileText, 
  Code, 
  ExternalLink, 
  Copy, 
  CheckCircle, 
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Database,
  TestTube,
  BookOpen,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ApiEndpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  description: string;
  category: string;
  requiredPermissions: string[];
  sampleRequest?: any;
  sampleResponse?: any;
  parameters?: Array<{ name: string; type: string; required: boolean; description: string }>;
}

const apiEndpoints: ApiEndpoint[] = [
  // Referans Veriler Kategorisi
  {
    id: 'cities',
    name: 'Şehirler Listesi',
    method: 'GET',
    endpoint: '/api/secure/getCities',
    description: 'Türkiye şehirlerinin tam listesini getirir',
    category: 'referans',
    requiredPermissions: ['data:read'],
    parameters: [
      { name: 'search', type: 'string', required: false, description: 'Şehir adında arama' },
      { name: 'limit', type: 'number', required: false, description: 'Sayfa başına kayıt sayısı' },
      { name: 'offset', type: 'number', required: false, description: 'Başlangıç noktası' }
    ],
    sampleResponse: { success: true, data: [{id: 1, name: "Adana"}, {id: 6, name: "Ankara"}] }
  },
  {
    id: 'countries',
    name: 'Ülkeler Listesi',
    method: 'GET',
    endpoint: '/api/secure/getCountries',
    description: 'Dünya ülkelerinin listesini getirir',
    category: 'referans',
    requiredPermissions: ['data:read'],
    sampleResponse: { success: true, data: [{id: 1, name: "Türkiye", phoneCode: "+90"}] }
  },
  {
    id: 'car-brands',
    name: 'Araç Markaları',
    method: 'GET',
    endpoint: '/api/secure/getCarBrands',
    description: 'Araç markalarının listesini getirir',
    category: 'referans',
    requiredPermissions: ['data:read'],
    sampleResponse: { success: true, data: [{id: 1, name: "Ford"}, {id: 2, name: "Mercedes"}] }
  },
  {
    id: 'car-models',
    name: 'Araç Modelleri',
    method: 'GET',
    endpoint: '/api/secure/getCarModels',
    description: 'Araç modellerinin listesini getirir',
    category: 'referans',
    requiredPermissions: ['data:read'],
    parameters: [
      { name: 'brandId', type: 'number', required: false, description: 'Belirli bir marka için modeller' }
    ],
    sampleResponse: { success: true, data: [{id: 1, name: "Transit", brandId: 1}] }
  },
  // Asset Yönetimi
  {
    id: 'assets-list',
    name: 'Araç Listesi',
    method: 'GET',
    endpoint: '/api/secure/assets',
    description: 'Şirket araçlarının listesini getirir',
    category: 'asset',
    requiredPermissions: ['asset:read'],
    parameters: [
      { name: 'search', type: 'string', required: false, description: 'Plaka veya model araması' },
      { name: 'workAreaId', type: 'number', required: false, description: 'Çalışma alanına göre filtre' }
    ],
    sampleResponse: { success: true, data: [{id: 1, plateNumber: "34ABC123", modelName: "Ford Transit"}] }
  },
  {
    id: 'assets-create',
    name: 'Yeni Araç Ekle',
    method: 'POST',
    endpoint: '/api/secure/assets',
    description: 'Sisteme yeni araç ekler',
    category: 'asset',
    requiredPermissions: ['asset:write'],
    sampleRequest: {
      plateNumber: "34XYZ789",
      modelId: 1,
      year: 2023,
      workAreaId: 1,
      ownershipTypeId: 1,
      isActive: true
    },
    sampleResponse: { success: true, message: "Araç başarıyla eklendi", data: {id: 123} }
  },
  // Personel Yönetimi
  {
    id: 'personnel-list',
    name: 'Personel Listesi',
    method: 'GET',
    endpoint: '/api/secure/getPersonnel',
    description: 'Şirket personelinin listesini getirir',
    category: 'personel',
    requiredPermissions: ['data:read'],
    sampleResponse: { success: true, data: [{id: 1, name: "Ahmet Yılmaz", position: "Şoför"}] }
  },
  {
    id: 'personnel-create',
    name: 'Yeni Personel Ekle',
    method: 'POST',
    endpoint: '/api/secure/addPersonnel',
    description: 'Sisteme yeni personel ekler',
    category: 'personel',
    requiredPermissions: ['data:write'],
    sampleRequest: {
      name: "Mehmet Kaya",
      positionId: 1,
      workAreaId: 1,
      phone: "0532-123-4567",
      email: "mehmet@company.com"
    },
    sampleResponse: { success: true, message: "Personel başarıyla eklendi" }
  },
  // Finansal İşlemler
  {
    id: 'financial-accounts',
    name: 'Finansal Hesaplar',
    method: 'GET',
    endpoint: '/api/secure/financial/current-accounts',
    description: 'Finansal işlem kayıtlarını getirir',
    category: 'finansal',
    requiredPermissions: ['financial:read'],
    sampleResponse: { success: true, data: [{id: 1, amount: 50000, paymentType: "hasar"}] }
  },
  // Dokuman Yönetimi
  {
    id: 'document-upload',
    name: 'Dosya Yükleme',
    method: 'POST',
    endpoint: '/api/secure/documents/upload',
    description: 'Asset veya personel için dosya yükler',
    category: 'dokuman',
    requiredPermissions: ['document:write'],
    sampleRequest: "FormData (multipart/form-data)",
    sampleResponse: { success: true, message: "Dosya başarıyla yüklendi" }
  }
];

const categoryNames = {
  referans: 'Referans Veriler',
  asset: 'Araç Yönetimi', 
  personel: 'Personel Yönetimi',
  finansal: 'Finansal İşlemler',
  dokuman: 'Döküman Yönetimi'
};

const categoryColors = {
  referans: 'bg-blue-50 text-blue-700 border-blue-200',
  asset: 'bg-green-50 text-green-700 border-green-200',
  personel: 'bg-purple-50 text-purple-700 border-purple-200',
  finansal: 'bg-orange-50 text-orange-700 border-orange-200',
  dokuman: 'bg-pink-50 text-pink-700 border-pink-200'
};

const methodColors = {
  GET: 'bg-green-100 text-green-800',
  POST: 'bg-blue-100 text-blue-800',
  PUT: 'bg-yellow-100 text-yellow-800',
  DELETE: 'bg-red-100 text-red-800'
};

export default function ApiCenter() {
  const [selectedApi, setSelectedApi] = useState<ApiEndpoint | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [requestBody, setRequestBody] = useState("{}");
  const [testResponse, setTestResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(['referans']));
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // URL parametrelerini ekle
  const [urlParams, setUrlParams] = useState<Record<string, string>>({});

  const filteredEndpoints = apiEndpoints.filter(endpoint => {
    const matchesCategory = selectedCategory === 'all' || endpoint.category === selectedCategory;
    const matchesSearch = !searchTerm || 
      endpoint.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      endpoint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      endpoint.endpoint.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  const categorizedEndpoints = filteredEndpoints.reduce((acc, endpoint) => {
    if (!acc[endpoint.category]) {
      acc[endpoint.category] = [];
    }
    acc[endpoint.category].push(endpoint);
    return acc;
  }, {} as Record<string, ApiEndpoint[]>);

  const toggleCategory = (category: string) => {
    const newOpenCategories = new Set(openCategories);
    if (newOpenCategories.has(category)) {
      newOpenCategories.delete(category);
    } else {
      newOpenCategories.add(category);
    }
    setOpenCategories(newOpenCategories);
  };

  const testApi = async () => {
    if (!selectedApi || !apiKey) {
      toast({
        title: "Hata",
        description: "API seçin ve API anahtarı girin",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // URL'yi oluştur
      let url = selectedApi.endpoint;
      
      // URL parametrelerini ekle
      if (selectedApi.method === 'GET' && Object.keys(urlParams).length > 0) {
        const params = new URLSearchParams();
        Object.entries(urlParams).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
        if (params.toString()) {
          url += '?' + params.toString();
        }
      }

      const options: RequestInit = {
        method: selectedApi.method,
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        }
      };

      // POST/PUT için body ekle
      if (['POST', 'PUT'].includes(selectedApi.method)) {
        try {
          options.body = requestBody;
        } catch (error) {
          throw new Error('Geçersiz JSON formatı');
        }
      }

      const response = await fetch(url, options);
      const data = await response.json();
      
      setTestResponse({
        status: response.status,
        statusText: response.statusText,
        data: data
      });

      toast({
        title: response.ok ? "Başarılı" : "Hata",
        description: response.ok ? "API başarıyla test edildi" : `HTTP ${response.status}: ${response.statusText}`,
        variant: response.ok ? "default" : "destructive"
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      setTestResponse({
        status: 'ERROR',
        statusText: 'Network Error',
        data: { error: errorMessage }
      });
      
      toast({
        title: "Bağlantı Hatası",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Kopyalandı",
      description: "Panoya kopyalandı"
    });
  };

  const handleApiSelect = (api: ApiEndpoint) => {
    setSelectedApi(api);
    setTestResponse(null);
    setUrlParams({});
    
    // Sample request'i request body'ye yükle
    if (api.sampleRequest) {
      setRequestBody(JSON.stringify(api.sampleRequest, null, 2));
    } else {
      setRequestBody('{}');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="text-white" size={24} />
            </div>
            API Test & Dokümantasyon Merkezi
          </h1>
          <p className="text-gray-600">
            Tüm API endpoint'leri tek yerde test edin ve dokümantasyonu inceleyin
          </p>
        </div>

        <Tabs defaultValue="explorer" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="explorer" className="flex items-center gap-2">
              <Database size={16} />
              API Explorer
            </TabsTrigger>
            <TabsTrigger value="tester" className="flex items-center gap-2">
              <TestTube size={16} />
              API Test
            </TabsTrigger>
            <TabsTrigger value="docs" className="flex items-center gap-2">
              <BookOpen size={16} />
              Dokümantasyon
            </TabsTrigger>
          </TabsList>

          {/* API Explorer Tab */}
          <TabsContent value="explorer" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sol Panel - API Listesi */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">API'ler ({filteredEndpoints.length})</CardTitle>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        138+ Endpoint
                      </Badge>
                    </div>
                    
                    {/* Arama ve Filtre */}
                    <div className="space-y-3">
                      <Input
                        placeholder="API ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="text-sm"
                      />
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Kategori seç" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tüm Kategoriler</SelectItem>
                          {Object.entries(categoryNames).map(([key, name]) => (
                            <SelectItem key={key} value={key}>{name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-0">
                    <div className="max-h-96 overflow-y-auto">
                      {Object.entries(categorizedEndpoints).map(([category, endpoints]) => (
                        <Collapsible 
                          key={category}
                          open={openCategories.has(category)}
                          onOpenChange={() => toggleCategory(category)}
                        >
                          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-gray-50 border-b">
                            <div className="flex items-center gap-2">
                              {openCategories.has(category) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              <span className="font-medium text-sm">{categoryNames[category as keyof typeof categoryNames]}</span>
                              <Badge variant="outline" className="text-xs">{endpoints.length}</Badge>
                            </div>
                          </CollapsibleTrigger>
                          
                          <CollapsibleContent>
                            {endpoints.map((api) => (
                              <div
                                key={api.id}
                                className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                                  selectedApi?.id === api.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                }`}
                                onClick={() => handleApiSelect(api)}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium">{api.name}</span>
                                  <Badge className={`text-xs ${methodColors[api.method]}`}>
                                    {api.method}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-600 mb-1">{api.description}</p>
                                <code className="text-xs text-gray-500 bg-gray-100 px-1 rounded">
                                  {api.endpoint}
                                </code>
                              </div>
                            ))}
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sağ Panel - API Detayları */}
              <div className="lg:col-span-2">
                {selectedApi ? (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Badge className={`${methodColors[selectedApi.method]}`}>
                          {selectedApi.method}
                        </Badge>
                        <CardTitle className="text-lg">{selectedApi.name}</CardTitle>
                        <Badge variant="outline" className={categoryColors[selectedApi.category as keyof typeof categoryColors]}>
                          {categoryNames[selectedApi.category as keyof typeof categoryNames]}
                        </Badge>
                      </div>
                      <p className="text-gray-600">{selectedApi.description}</p>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      {/* Endpoint URL */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Endpoint</label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-gray-100 p-2 rounded text-sm font-mono">
                            {selectedApi.endpoint}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(selectedApi.endpoint)}
                          >
                            <Copy size={14} />
                          </Button>
                        </div>
                      </div>

                      {/* Parametreler */}
                      {selectedApi.parameters && selectedApi.parameters.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium mb-2">Parametreler</label>
                          <div className="space-y-2">
                            {selectedApi.parameters.map((param) => (
                              <div key={param.name} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                <code className="text-sm font-mono text-blue-600">{param.name}</code>
                                <Badge variant={param.required ? "default" : "secondary"} className="text-xs">
                                  {param.type}
                                </Badge>
                                {param.required && (
                                  <Badge variant="destructive" className="text-xs">
                                    Gerekli
                                  </Badge>
                                )}
                                <span className="text-sm text-gray-600 ml-auto">{param.description}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* İzinler */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Gerekli İzinler</label>
                        <div className="flex flex-wrap gap-1">
                          {selectedApi.requiredPermissions.map((permission) => (
                            <Badge key={permission} variant="outline" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Örnek Yanıt */}
                      {selectedApi.sampleResponse && (
                        <div>
                          <label className="block text-sm font-medium mb-2">Örnek Yanıt</label>
                          <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                            {JSON.stringify(selectedApi.sampleResponse, null, 2)}
                          </pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="flex items-center justify-center h-64">
                      <div className="text-center text-gray-500">
                        <Database size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Test etmek için bir API seçin</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* API Test Tab */}
          <TabsContent value="tester" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sol Panel - Test Ayarları */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TestTube size={20} />
                    API Test Ayarları
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* API Key */}
                  <div>
                    <label className="block text-sm font-medium mb-2">API Anahtarı</label>
                    <Input
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="ak_prod2025_rwba6dj1sw"
                      className="font-mono text-sm"
                      type="password"
                    />
                  </div>

                  {/* API Seçimi */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Test Edilecek API</label>
                    <Select 
                      value={selectedApi?.id || ""} 
                      onValueChange={(value) => {
                        const api = apiEndpoints.find(a => a.id === value);
                        if (api) handleApiSelect(api);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="API seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(categorizedEndpoints).map(([category, endpoints]) => (
                          <div key={category}>
                            <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {categoryNames[category as keyof typeof categoryNames]}
                            </div>
                            {endpoints.map((api) => (
                              <SelectItem key={api.id} value={api.id}>
                                <div className="flex items-center gap-2">
                                  <Badge className={`text-xs ${methodColors[api.method]}`}>
                                    {api.method}
                                  </Badge>
                                  {api.name}
                                </div>
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* URL Parametreleri (GET için) */}
                  {selectedApi?.method === 'GET' && selectedApi.parameters && (
                    <div>
                      <label className="block text-sm font-medium mb-2">URL Parametreleri</label>
                      <div className="space-y-2">
                        {selectedApi.parameters.map((param) => (
                          <div key={param.name}>
                            <label className="block text-xs text-gray-600 mb-1">
                              {param.name} ({param.type}) {param.required && <span className="text-red-500">*</span>}
                            </label>
                            <Input
                              placeholder={param.description}
                              value={urlParams[param.name] || ''}
                              onChange={(e) => setUrlParams({...urlParams, [param.name]: e.target.value})}
                              className="text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Request Body (POST/PUT için) */}
                  {selectedApi && ['POST', 'PUT'].includes(selectedApi.method) && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Request Body (JSON)</label>
                      <Textarea
                        value={requestBody}
                        onChange={(e) => setRequestBody(e.target.value)}
                        className="font-mono text-sm min-h-32"
                        placeholder="JSON verisi girin"
                      />
                    </div>
                  )}

                  {/* Test Butonu */}
                  <Button 
                    onClick={testApi} 
                    disabled={!selectedApi || !apiKey || isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Test Ediliyor...
                      </>
                    ) : (
                      <>
                        <Play size={16} className="mr-2" />
                        API'yi Test Et
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Sağ Panel - Test Sonucu */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code size={20} />
                    Test Sonucu
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {testResponse ? (
                    <div className="space-y-4">
                      {/* Status */}
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={testResponse.status === 200 ? "default" : "destructive"}
                          className="text-sm"
                        >
                          {testResponse.status} {testResponse.statusText}
                        </Badge>
                        {testResponse.status === 200 ? (
                          <CheckCircle size={16} className="text-green-500" />
                        ) : (
                          <AlertCircle size={16} className="text-red-500" />
                        )}
                      </div>

                      {/* Response Data */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium">Yanıt Verisi</label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(JSON.stringify(testResponse.data, null, 2))}
                          >
                            <Copy size={14} />
                          </Button>
                        </div>
                        <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-96 border">
                          {JSON.stringify(testResponse.data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                      <div className="text-center">
                        <TestTube size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Test sonucu burada görünecek</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Dokümantasyon Tab */}
          <TabsContent value="docs" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Swagger Dokümantasyonu */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen size={20} />
                    Swagger API Dokümantasyonu
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Tam API dokümantasyonu için Swagger UI'yi kullanın
                  </p>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full flex items-center gap-2"
                    onClick={() => window.open('/api/docs', '_blank')}
                  >
                    <ExternalLink size={16} />
                    Swagger UI'yi Aç
                  </Button>
                </CardContent>
              </Card>

              {/* API İstatistikleri */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database size={20} />
                    API İstatistikleri
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">138+</div>
                      <div className="text-sm text-blue-600">Toplam API</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded">
                      <div className="text-2xl font-bold text-green-600">{apiEndpoints.length}</div>
                      <div className="text-sm text-green-600">Dokümante API</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded">
                      <div className="text-2xl font-bold text-purple-600">5</div>
                      <div className="text-sm text-purple-600">Kategori</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded">
                      <div className="text-2xl font-bold text-orange-600">21</div>
                      <div className="text-sm text-orange-600">İzin Tipi</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Kategoriler Özeti */}
            <Card>
              <CardHeader>
                <CardTitle>API Kategorileri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(categoryNames).map(([key, name]) => {
                    const count = apiEndpoints.filter(api => api.category === key).length;
                    return (
                      <div key={key} className={`p-4 rounded-lg border ${categoryColors[key as keyof typeof categoryColors]}`}>
                        <h3 className="font-medium mb-2">{name}</h3>
                        <p className="text-sm opacity-75">{count} API endpoint</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}