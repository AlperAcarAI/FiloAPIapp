import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Play, Database, Users, Route, BarChart3, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

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
      const response = await fetch(url);
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