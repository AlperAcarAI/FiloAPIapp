import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Play, Database, Users, Route, BarChart3, Copy, Shield, LogOut, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

interface ApiResponse {
  success: boolean;
  data?: any;
  message?: string;
  count?: number;
}

export default function ApiTest() {
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [apiKey, setApiKey] = useState('test-api-key-2025');
  const [user, setUser] = useState<any>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    setLocation('/login');
    toast({
      title: "Çıkış Yapıldı",
      description: "Güvenli bir şekilde çıkış yaptınız",
    });
  };

  const testEndpoints = [
    {
      id: 'araclar',
      name: 'Araç Listesi',
      endpoint: '/api/test/araclar',
      description: 'Tüm araçları listeler',
      icon: <Database className="w-4 h-4" />,
      params: [
        { name: 'status', type: 'select', options: ['aktif', 'bakim', 'ariza', 'pasif'] },
        { name: 'marka', type: 'text' },
        { name: 'tur', type: 'text' }
      ]
    },
    {
      id: 'soforler',
      name: 'Şoför Listesi',
      endpoint: '/api/test/soforler',
      description: 'Tüm şoförleri listeler',
      icon: <Users className="w-4 h-4" />,
      params: [
        { name: 'durum', type: 'select', options: ['aktif', 'izinli', 'pasif'] }
      ]
    },
    {
      id: 'yolculuklar',
      name: 'Yolculuk Listesi',
      endpoint: '/api/test/yolculuklar',
      description: 'Tüm yolculukları listeler',
      icon: <Route className="w-4 h-4" />,
      params: [
        { name: 'durum', type: 'select', options: ['devam_ediyor', 'tamamlandi', 'iptal'] }
      ]
    },
    {
      id: 'dashboard',
      name: 'Dashboard',
      endpoint: '/api/test/dashboard',
      description: 'Özet istatistikler',
      icon: <BarChart3 className="w-4 h-4" />,
      params: []
    }
  ];

  const callApi = async (endpoint: string, params: Record<string, string> = {}) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const url = `${endpoint}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      // API key ile güvenli istek
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (apiKey) {
        headers['x-api-key'] = apiKey;
      }

      const response = await fetch(url, { headers });
      const data = await response.json();

      setResponse(data);
      
      if (data.success) {
        toast({
          title: "Başarılı",
          description: data.message || "API çağrısı başarılı",
        });
      } else {
        toast({
          title: "Hata",
          description: data.message || "API çağrısı başarısız",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('API çağrısı hatası:', error);
      toast({
        title: "Hata",
        description: "API çağrısı sırasında hata oluştu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Kopyalandı",
      description: "Metin panoya kopyalandı",
    });
  };

  const formatJson = (obj: any) => {
    return JSON.stringify(obj, null, 2);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Güvenlik Header */}
      <div className="mb-6">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-blue-600" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-blue-800">Güvenli API Test Ortamı</span>
                    {user && (
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        <User className="h-3 w-3 mr-1" />
                        {user.username}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-blue-600">
                    API Key koruması aktif - Güvenli test ortamı
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation('/')}
                  className="text-blue-600 border-blue-200"
                >
                  Ana Sayfa
                </Button>
                {user && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="text-red-600 border-red-200"
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Çıkış
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">API Test Ortamı</h1>
        <p className="text-muted-foreground">
          Filo yönetimi API'lerini gerçek verilerle test edin
        </p>
      </div>

      <Tabs defaultValue="endpoints" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="endpoints">API Testleri</TabsTrigger>
          <TabsTrigger value="documentation">Dokümantasyon</TabsTrigger>
        </TabsList>

        <TabsContent value="endpoints" className="space-y-6">
          {/* API Key Ayarları */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-yellow-600" />
                API Key Ayarları
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label className="text-sm font-medium">API Key</Label>
                <div className="flex gap-2">
                  <Input
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="API Key girin"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(apiKey)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-yellow-600">
                  Geçerli API Keys: test-api-key-2025, fleet-management-api-key, demo-api-access-key
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Test Endpoints */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Test Endpoint'leri</h2>
              {testEndpoints.map((endpoint) => (
                <Card key={endpoint.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {endpoint.icon}
                        <CardTitle className="text-lg">{endpoint.name}</CardTitle>
                      </div>
                      <Badge variant="outline">GET</Badge>
                    </div>
                    <CardDescription>{endpoint.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Endpoint URL</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-sm bg-muted px-2 py-1 rounded flex-1">
                            {endpoint.endpoint}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(endpoint.endpoint)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {endpoint.params.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Parametreler</Label>
                          {endpoint.params.map((param) => (
                            <div key={param.name} className="space-y-1">
                              <Label className="text-xs text-muted-foreground">
                                {param.name}
                              </Label>
                              {param.type === 'select' ? (
                                <Select
                                  value={filters[`${endpoint.id}_${param.name}`] || ''}
                                  onValueChange={(value) =>
                                    setFilters(prev => ({
                                      ...prev,
                                      [`${endpoint.id}_${param.name}`]: value
                                    }))
                                  }
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue placeholder={`${param.name} seçin`} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {param.options?.map((option) => (
                                      <SelectItem key={option} value={option}>
                                        {option}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input
                                  className="h-8"
                                  placeholder={`${param.name} girin`}
                                  value={filters[`${endpoint.id}_${param.name}`] || ''}
                                  onChange={(e) =>
                                    setFilters(prev => ({
                                      ...prev,
                                      [`${endpoint.id}_${param.name}`]: e.target.value
                                    }))
                                  }
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <Button
                        className="w-full"
                        onClick={() => {
                          const params: Record<string, string> = {};
                          endpoint.params.forEach(param => {
                            const value = filters[`${endpoint.id}_${param.name}`];
                            if (value) params[param.name] = value;
                          });
                          callApi(endpoint.endpoint, params);
                        }}
                        disabled={loading}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {loading ? 'Test Ediliyor...' : 'Test Et'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Response Display */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">API Yanıtı</h2>
              <Card>
                <CardHeader>
                  <CardTitle>Sonuç</CardTitle>
                  <CardDescription>
                    API çağrısının döndürdüğü yanıt
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {response ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge variant={response.success ? "default" : "destructive"}>
                          {response.success ? "Başarılı" : "Hata"}
                        </Badge>
                        {response.count !== undefined && (
                          <Badge variant="outline">{response.count} kayıt</Badge>
                        )}
                      </div>

                      {response.message && (
                        <p className="text-sm text-muted-foreground">
                          {response.message}
                        </p>
                      )}

                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          JSON Yanıtı
                        </Label>
                        <div className="relative">
                          <Textarea
                            value={formatJson(response)}
                            readOnly
                            className="min-h-[300px] font-mono text-sm"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => copyToClipboard(formatJson(response))}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Bir API endpoint'i test edin
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documentation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Dokümantasyonu</CardTitle>
              <CardDescription>
                Test endpoint'lerinin detaylı açıklamaları
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Test Verileri</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Araçlar</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">8</p>
                      <p className="text-xs text-muted-foreground">
                        Kamyon, minibüs, forklift
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Şoförler</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">5</p>
                      <p className="text-xs text-muted-foreground">
                        Aktif ve izinli şoförler
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Yolculuklar</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">3</p>
                      <p className="text-xs text-muted-foreground">
                        Tamamlanan ve devam eden
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">API Özellikleri</h3>
                <ul className="space-y-2 text-sm">
                  <li>• Gerçek PostgreSQL veritabanı ile çalışır</li>
                  <li>• Filtreleme ve arama parametreleri destekler</li>
                  <li>• JSON formatında yanıt döner</li>
                  <li>• Hata durumlarında detaylı mesaj verir</li>
                  <li>• İlişkisel veriler JOIN ile birleştirilir</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}