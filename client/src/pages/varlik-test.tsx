import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Database, Edit, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AssetApiResponse {
  id?: number;
  model_id?: number;
  model_year?: number;
  plate_number?: string;
  chassis_no?: string;
  engine_no?: string;
  ownership_type_id?: number;
  owner_company_id?: number;
  register_no?: string;
  register_date?: string;
  purchase_date?: string;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
  error?: string;
  message?: string;
}

export default function VarlikTest() {
  const [response, setResponse] = useState<AssetApiResponse | AssetApiResponse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [formData, setFormData] = useState({
    model_id: '1',
    model_year: '2023',
    plate_number: '',
    chassis_no: '',
    engine_no: '',
    ownership_type_id: '1',
    owner_company_id: '1',
    register_date: '',
    purchase_date: ''
  });
  const { toast } = useToast();

  const assetEndpoints = [
    {
      id: 'get-all',
      name: 'Tüm Varlıkları Listele',
      method: 'GET',
      endpoint: '/assets',
      description: 'Tüm varlıkları listeler',
      icon: <Database className="w-4 h-4" />,
      needsForm: false
    },
    {
      id: 'get-by-id',
      name: 'Varlık Detayı',
      method: 'GET',
      endpoint: '/assets/:id',
      description: 'Belirli bir varlığı getirir',
      icon: <Database className="w-4 h-4" />,
      needsForm: false,
      needsId: true
    },
    {
      id: 'create',
      name: 'Yeni Varlık Oluştur',
      method: 'POST',
      endpoint: '/assets',
      description: 'Yeni bir varlık oluşturur',
      icon: <Plus className="w-4 h-4" />,
      needsForm: true
    },
    {
      id: 'update',
      name: 'Varlık Güncelle',
      method: 'PUT',
      endpoint: '/assets/:id',
      description: 'Mevcut varlığı günceller',
      icon: <Edit className="w-4 h-4" />,
      needsForm: true,
      needsId: true
    },
    {
      id: 'delete',
      name: 'Varlık Sil',
      method: 'DELETE',
      endpoint: '/assets/:id',
      description: 'Varlığı siler',
      icon: <Trash2 className="w-4 h-4" />,
      needsForm: false,
      needsId: true
    }
  ];

  const testEndpoint = async (endpoint: any) => {
    setLoading(true);
    setResponse(null);

    try {
      let url = endpoint.endpoint;
      if (endpoint.needsId && selectedAssetId) {
        url = endpoint.endpoint.replace(':id', selectedAssetId);
      }

      const requestOptions: RequestInit = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      // API anahtarı varsa ekle (normalde gizli tutulur)
      const apiKey = 'test-api-key';
      if (apiKey) {
        requestOptions.headers = {
          ...requestOptions.headers,
          'x-api-key': apiKey
        };
      }

      if (endpoint.needsForm && (endpoint.method === 'POST' || endpoint.method === 'PUT')) {
        const payload = {
          model_id: parseInt(formData.model_id),
          model_year: parseInt(formData.model_year),
          plate_number: formData.plate_number,
          chassis_no: formData.chassis_no,
          engine_no: formData.engine_no,
          ownership_type_id: parseInt(formData.ownership_type_id),
          owner_company_id: parseInt(formData.owner_company_id),
          register_date: formData.register_date || null,
          purchase_date: formData.purchase_date || null
        };
        requestOptions.body = JSON.stringify(payload);
      }

      const response = await fetch(url, requestOptions);
      const data = await response.json();
      
      setResponse(data);

      if (response.ok) {
        toast({
          title: "Başarılı",
          description: `${endpoint.name} işlemi tamamlandı`,
        });
      } else {
        toast({
          title: "Hata",
          description: data.error || "API çağrısında hata oluştu",
          variant: "destructive",
        });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      setResponse({ error: errorMessage });
      toast({
        title: "Bağlantı Hatası",
        description: "API'ye ulaşılamadı",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      model_id: '1',
      model_year: '2023',
      plate_number: '',
      chassis_no: '',
      engine_no: '',
      ownership_type_id: '1',
      owner_company_id: '1',
      register_date: '',
      purchase_date: ''
    });
    setResponse(null);
    setSelectedAssetId('');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Varlık API Test</h1>
        <Button onClick={resetForm} variant="outline">
          Formu Temizle
        </Button>
      </div>

      {/* Endpoint Test Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assetEndpoints.map((endpoint) => (
          <Card key={endpoint.id} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {endpoint.icon}
                  {endpoint.name}
                </CardTitle>
                <Badge variant={endpoint.method === 'GET' ? 'secondary' : endpoint.method === 'POST' ? 'default' : endpoint.method === 'PUT' ? 'outline' : 'destructive'}>
                  {endpoint.method}
                </Badge>
              </div>
              <CardDescription>{endpoint.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <code className="text-sm bg-muted p-2 rounded block">
                  {endpoint.method} {endpoint.endpoint}
                </code>
                <Button 
                  onClick={() => testEndpoint(endpoint)}
                  disabled={loading || (endpoint.needsId && !selectedAssetId)}
                  className="w-full"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Test Et
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ID Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Varlık ID Seçimi</CardTitle>
          <CardDescription>Belirli bir varlıkla işlem yapmak için ID girin</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Asset ID (örnek: 1)"
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              className="max-w-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Inputs */}
      <Card>
        <CardHeader>
          <CardTitle>Varlık Form Verileri</CardTitle>
          <CardDescription>POST ve PUT işlemleri için kullanılacak veriler</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="model_id">Model ID</Label>
              <Select value={formData.model_id} onValueChange={(value) => setFormData(prev => ({ ...prev, model_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Model seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Mercedes Actros</SelectItem>
                  <SelectItem value="2">Ford Transit</SelectItem>
                  <SelectItem value="3">BMW 320i</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model_year">Model Yılı</Label>
              <Input
                id="model_year"
                type="number"
                min="2000"
                max="2025"
                value={formData.model_year}
                onChange={(e) => setFormData(prev => ({ ...prev, model_year: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plate_number">Plaka</Label>
              <Input
                id="plate_number"
                placeholder="34 ABC 123"
                value={formData.plate_number}
                onChange={(e) => setFormData(prev => ({ ...prev, plate_number: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="chassis_no">Şasi No</Label>
              <Input
                id="chassis_no"
                placeholder="WDB1234567890"
                value={formData.chassis_no}
                onChange={(e) => setFormData(prev => ({ ...prev, chassis_no: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="engine_no">Motor No</Label>
              <Input
                id="engine_no"
                placeholder="ENG123456"
                value={formData.engine_no}
                onChange={(e) => setFormData(prev => ({ ...prev, engine_no: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownership_type_id">Sahiplik Türü</Label>
              <Select value={formData.ownership_type_id} onValueChange={(value) => setFormData(prev => ({ ...prev, ownership_type_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sahiplik türü seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Owned</SelectItem>
                  <SelectItem value="2">Leased</SelectItem>
                  <SelectItem value="3">Rented</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner_company_id">Sahip Firma ID</Label>
              <Select value={formData.owner_company_id} onValueChange={(value) => setFormData(prev => ({ ...prev, owner_company_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Firma seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Test Company</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="register_date">Kayıt Tarihi</Label>
              <Input
                id="register_date"
                type="date"
                value={formData.register_date}
                onChange={(e) => setFormData(prev => ({ ...prev, register_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_date">Satın Alma Tarihi</Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Response Display */}
      {response && (
        <Card>
          <CardHeader>
            <CardTitle>API Yanıtı</CardTitle>
            <CardDescription>Son API çağrısının sonucu</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(response, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}