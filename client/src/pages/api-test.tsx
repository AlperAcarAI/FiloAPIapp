import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Play, Copy, CheckCircle, XCircle, Clock, FileCode } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface ApiEndpoint {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: string;
  category: string;
  dataCount?: string;
}

const API_ENDPOINTS: ApiEndpoint[] = [
  {
    id: "getCities",
    name: "Şehirler API",
    description: "Türkiye'deki 81 şehrin listesini döndürür",
    endpoint: "/api/secure/getCities",
    method: "GET",
    category: "Referans Veriler",
    dataCount: "81 şehir"
  },
  {
    id: "getPenaltyTypes", 
    name: "Ceza Türleri API",
    description: "301 trafik cezası türünün detaylı listesini döndürür",
    endpoint: "/api/secure/getPenaltyTypes",
    method: "GET",
    category: "Referans Veriler",
    dataCount: "301 ceza türü"
  },
  {
    id: "getCountries",
    name: "Ülkeler API", 
    description: "Dünya ülkeleri ve telefon kodlarının listesini döndürür",
    endpoint: "/api/secure/getCountries",
    method: "GET",
    category: "Referans Veriler",
    dataCount: "195 ülke"
  },
  {
    id: "getPolicyTypes",
    name: "Poliçe Türleri API",
    description: "Sigorta poliçe türlerinin listesini döndürür", 
    endpoint: "/api/secure/getPolicyTypes",
    method: "GET",
    category: "Referans Veriler",
    dataCount: "7 poliçe türü"
  },
  {
    id: "getPaymentMethods",
    name: "Ödeme Yöntemleri API",
    description: "Ödeme yöntemlerinin listesini döndürür",
    endpoint: "/api/secure/getPaymentMethods", 
    method: "GET",
    category: "Referans Veriler",
    dataCount: "7 ödeme yöntemi"
  },
  {
    id: "getMaintenanceTypes",
    name: "Bakım Türleri API",
    description: "Araç bakım türlerinin listesini döndürür",
    endpoint: "/api/secure/getMaintenanceTypes",
    method: "GET", 
    category: "Referans Veriler",
    dataCount: "7 bakım türü"
  }
];

export default function ApiTest() {
  const [selectedApi, setSelectedApi] = useState<ApiEndpoint | null>(null);
  const [apiKey, setApiKey] = useState("ak_demo2025key");
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const testApi = async (endpoint: ApiEndpoint) => {
    if (!apiKey.trim()) {
      toast({
        title: "Hata!",
        description: "API anahtarı gerekli",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const response = await fetch(`${window.location.origin}${endpoint.endpoint}`, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      setResponse(data);
      toast({
        title: "Başarılı!",
        description: `${endpoint.name} başarıyla test edildi`
      });
    } catch (err: any) {
      const errorMessage = err.message || "Bilinmeyen hata";
      setError(errorMessage);
      toast({
        title: "Test Başarısız!",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Kopyalandı!",
      description: "Metin panoya kopyalandı"
    });
  };

  const getStatusBadge = (status: "success" | "error" | "loading") => {
    if (status === "success") {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Başarılı</Badge>;
    }
    if (status === "error") {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Hata</Badge>;
    }
    return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Test Ediliyor</Badge>;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link to="/">
                <Button variant="outline" size="sm" className="mr-4">
                  <ArrowLeft size={16} className="mr-2" />
                  Ana Sayfa
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  API Test Ortamı
                </h1>
                <p className="text-slate-600">
                  Güvenli API endpoint'lerini test edin
                </p>
              </div>
            </div>
            <div>
              <Button
                variant="outline"
                onClick={() => window.open("/api/docs", "_blank")}
                className="mr-2"
              >
                <FileCode size={16} className="mr-2" />
                API Dokümantasyonu
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* API List Panel */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Play className="w-5 h-5 mr-2" />
                  API Endpoint'leri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* API Key Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    API Anahtarı
                  </label>
                  <Input
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="API anahtarınızı girin"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Demo: ak_demo2025key
                  </p>
                </div>

                {/* API Endpoints */}
                <div className="space-y-2">
                  <h3 className="font-medium text-slate-800 text-sm">Referans Veriler</h3>
                  {API_ENDPOINTS.map((endpoint) => (
                    <div
                      key={endpoint.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedApi?.id === endpoint.id
                          ? "border-blue-300 bg-blue-50"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                      onClick={() => setSelectedApi(endpoint)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-800 text-sm">
                            {endpoint.name}
                          </h4>
                          <p className="text-xs text-slate-600 mt-1">
                            {endpoint.description}
                          </p>
                          {endpoint.dataCount && (
                            <p className="text-xs text-blue-600 mt-1 font-medium">
                              {endpoint.dataCount}
                            </p>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs ml-2">
                          {endpoint.method}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Test Panel */}
          <div className="lg:col-span-2">
            {selectedApi ? (
              <div className="space-y-6">
                {/* API Details */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        {selectedApi.name}
                        <Badge className="ml-2">{selectedApi.method}</Badge>
                      </CardTitle>
                      <Button
                        onClick={() => testApi(selectedApi)}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {loading ? "Test Ediliyor..." : "Test Et"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Endpoint
                        </label>
                        <div className="flex items-center space-x-2">
                          <Input
                            value={`${window.location.origin}${selectedApi.endpoint}`}
                            readOnly
                            className="font-mono text-sm"
                          />
                          <Button
                            variant="outline" 
                            size="sm"
                            onClick={() => copyToClipboard(`${window.location.origin}${selectedApi.endpoint}`)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Açıklama
                        </label>
                        <p className="text-slate-600 text-sm">
                          {selectedApi.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Response */}
                {(response || error || loading) && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Yanıt</CardTitle>
                        {loading && getStatusBadge("loading")}
                        {response && getStatusBadge("success")}
                        {error && getStatusBadge("error")}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {loading && (
                        <div className="flex items-center space-x-2 text-slate-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span>API testi yapılıyor...</span>
                        </div>
                      )}
                      
                      {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-center space-x-2 text-red-800 mb-2">
                            <XCircle className="w-4 h-4" />
                            <span className="font-medium">Test Başarısız</span>
                          </div>
                          <p className="text-red-700 text-sm">{error}</p>
                        </div>
                      )}

                      {response && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700">JSON Yanıt</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(JSON.stringify(response, null, 2))}
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Kopyala
                            </Button>
                          </div>
                          <Textarea
                            value={JSON.stringify(response, null, 2)}
                            readOnly
                            className="font-mono text-xs h-96 resize-none"
                          />
                          
                          {Array.isArray(response?.data) && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <p className="text-green-800 text-sm">
                                <strong>Toplam Kayıt:</strong> {response.data.length}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Play className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">
                    API Seç ve Test Et
                  </h3>
                  <p className="text-slate-500">
                    Sol panelden bir API endpoint'i seçin ve test etmeye başlayın.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}