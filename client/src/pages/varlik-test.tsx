import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Play, Database, Edit, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VarlikApiResponse {
  varlik_id?: string;
  tur?: string;
  marka?: string;
  model?: string;
  plaka?: string;
  sahiplik?: string;
  edinim_tarihi?: string;
  kullanim_sayaci?: number;
  created_at?: string;
  updated_at?: string;
  error?: string;
  message?: string;
}

export default function VarlikTest() {
  const [response, setResponse] = useState<VarlikApiResponse | VarlikApiResponse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedVarlikId, setSelectedVarlikId] = useState('');
  const [formData, setFormData] = useState({
    tur: '',
    marka: '',
    model: '',
    plaka: '',
    sahiplik: '',
    edinim_tarihi: '',
    kullanim_sayaci: ''
  });
  const { toast } = useToast();

  const varlikEndpoints = [
    {
      id: 'get-all',
      name: 'Tüm Varlıkları Listele',
      method: 'GET',
      endpoint: '/varliklar',
      description: 'Tüm varlıkları listeler',
      icon: <Database className="w-4 h-4" />,
      needsForm: false
    },
    {
      id: 'get-by-id',
      name: 'Varlık Detayı',
      method: 'GET',
      endpoint: '/varliklar/:id',
      description: 'Belirli bir varlığı getirir',
      icon: <Database className="w-4 h-4" />,
      needsForm: false,
      needsId: true
    },
    {
      id: 'create',
      name: 'Yeni Varlık Oluştur',
      method: 'POST',
      endpoint: '/varliklar',
      description: 'Yeni bir varlık oluşturur',
      icon: <Plus className="w-4 h-4" />,
      needsForm: true
    },
    {
      id: 'update',
      name: 'Varlık Güncelle',
      method: 'PUT',
      endpoint: '/varliklar/:id',
      description: 'Mevcut varlığı günceller',
      icon: <Edit className="w-4 h-4" />,
      needsForm: true,
      needsId: true
    },
    {
      id: 'delete',
      name: 'Varlık Sil',
      method: 'DELETE',
      endpoint: '/varliklar/:id',
      description: 'Varlığı siler',
      icon: <Trash2 className="w-4 h-4" />,
      needsForm: false,
      needsId: true
    }
  ];

  const callApi = async (endpoint: any) => {
    setLoading(true);
    try {
      let url = endpoint.endpoint;
      
      // ID gerektiren endpoint'ler için URL'yi düzenle
      if (endpoint.needsId) {
        if (!selectedVarlikId) {
          toast({
            title: "Hata",
            description: "Lütfen bir varlık ID'si girin",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        url = url.replace(':id', selectedVarlikId);
      }

      const requestOptions: RequestInit = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      // POST ve PUT için form verilerini ekle
      if (endpoint.needsForm && (endpoint.method === 'POST' || endpoint.method === 'PUT')) {
        const bodyData: any = {};
        
        if (formData.tur) bodyData.tur = formData.tur;
        if (formData.marka) bodyData.marka = formData.marka;
        if (formData.model) bodyData.model = formData.model;
        if (formData.plaka) bodyData.plaka = formData.plaka;
        if (formData.sahiplik) bodyData.sahiplik = formData.sahiplik;
        if (formData.edinim_tarihi) bodyData.edinim_tarihi = formData.edinim_tarihi;
        if (formData.kullanim_sayaci) bodyData.kullanim_sayaci = parseInt(formData.kullanim_sayaci);

        requestOptions.body = JSON.stringify(bodyData);
      }

      const response = await fetch(url, requestOptions);
      const data = await response.json();

      setResponse(data);
      
      if (response.ok) {
        toast({
          title: "Başarılı",
          description: `${endpoint.name} işlemi başarılı`,
        });
      } else {
        toast({
          title: "Hata",
          description: data.error || "API çağrısı başarısız",
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

  const formatJson = (obj: any) => {
    return JSON.stringify(obj, null, 2);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-blue-100 text-blue-800';
      case 'POST': return 'bg-green-100 text-green-800';
      case 'PUT': return 'bg-orange-100 text-orange-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Varlık API Test Ortamı</h1>
        <p className="text-muted-foreground">
          Varlık yönetimi API'lerini test edin - 5 farklı endpoint mevcut
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* API Endpoints */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">API Endpoint'leri</h2>
          
          {varlikEndpoints.map((endpoint) => (
            <Card key={endpoint.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {endpoint.icon}
                    <CardTitle className="text-lg">{endpoint.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className={getMethodColor(endpoint.method)}>
                    {endpoint.method}
                  </Badge>
                </div>
                <CardDescription>{endpoint.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Endpoint URL</Label>
                    <code className="text-sm bg-muted px-2 py-1 rounded block mt-1">
                      {endpoint.endpoint}
                    </code>
                  </div>

                  {endpoint.needsId && (
                    <div>
                      <Label className="text-sm font-medium">Varlık ID</Label>
                      <Input
                        className="mt-1"
                        placeholder="UUID formatında varlık ID'si"
                        value={selectedVarlikId}
                        onChange={(e) => setSelectedVarlikId(e.target.value)}
                      />
                    </div>
                  )}

                  {endpoint.needsForm && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Form Verileri</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Tür</Label>
                          <Select value={formData.tur} onValueChange={(value) => setFormData({...formData, tur: value})}>
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Tür seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Binek">Binek</SelectItem>
                              <SelectItem value="Kamyon">Kamyon</SelectItem>
                              <SelectItem value="Forklift">Forklift</SelectItem>
                              <SelectItem value="Vinc">Vinç</SelectItem>
                              <SelectItem value="Ekskavator">Ekskavatör</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Sahiplik</Label>
                          <Select value={formData.sahiplik} onValueChange={(value) => setFormData({...formData, sahiplik: value})}>
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Sahiplik seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Sirket">Şirket</SelectItem>
                              <SelectItem value="Kiralik">Kiralık</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Marka</Label>
                          <Input
                            className="h-8"
                            placeholder="Marka"
                            value={formData.marka}
                            onChange={(e) => setFormData({...formData, marka: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Model</Label>
                          <Input
                            className="h-8"
                            placeholder="Model"
                            value={formData.model}
                            onChange={(e) => setFormData({...formData, model: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Plaka</Label>
                          <Input
                            className="h-8"
                            placeholder="Plaka"
                            value={formData.plaka}
                            onChange={(e) => setFormData({...formData, plaka: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Kullanım Sayacı</Label>
                          <Input
                            className="h-8"
                            type="number"
                            placeholder="Sayaç"
                            value={formData.kullanim_sayaci}
                            onChange={(e) => setFormData({...formData, kullanim_sayaci: e.target.value})}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Edinim Tarihi</Label>
                          <Input
                            className="h-8"
                            type="date"
                            value={formData.edinim_tarihi}
                            onChange={(e) => setFormData({...formData, edinim_tarihi: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    onClick={() => callApi(endpoint)}
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
                  <Textarea
                    value={formatJson(response)}
                    readOnly
                    rows={20}
                    className="font-mono text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(formatJson(response))}
                    >
                      Kopyala
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setResponse(null)}
                    >
                      Temizle
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Henüz bir API çağrısı yapılmadı. Yukarıdaki endpoint'lerden birini test edin.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}