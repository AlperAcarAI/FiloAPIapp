import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import DocumentUploader from '@/components/DocumentUploader';
import { 
  Upload, 
  Download, 
  FileText, 
  Image, 
  Trash2, 
  Search, 
  Filter,
  Calendar,
  User,
  FolderOpen,
  Code,
  Database,
  Server,
  Package,
  Settings
} from 'lucide-react';

const DocumentManagement = () => {
  const [selectedAssetId, setSelectedAssetId] = useState<number>(1); // Demo asset ID
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocType, setSelectedDocType] = useState<string>('');

  // Dokuman kategorilerini getir
  const { data: docTypesData, isLoading: docTypesLoading } = useQuery({
    queryKey: ['/api/getDocTypes'],
    queryFn: async () => {
      const response = await fetch('/api/getDocTypes');
      if (!response.ok) throw new Error('Kategoriler yüklenemedi');
      return response.json();
    }
  });

  // Asset dokümanlarını getir
  const { data: documentsData, isLoading: documentsLoading, refetch: refetchDocuments } = useQuery({
    queryKey: ['/api/documents/asset', selectedAssetId, selectedDocType],
    queryFn: async () => {
      const url = new URL(`/api/documents/asset/${selectedAssetId}`, window.location.origin);
      if (selectedDocType) {
        url.searchParams.set('docTypeId', selectedDocType);
      }
      
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Dokümanlar yüklenemedi');
      return response.json();
    },
    enabled: !!selectedAssetId
  });

  // Demo asset listesi
  const demoAssets = [
    { id: 1, plateNumber: '06ABC123', modelName: 'Ford Transit' },
    { id: 2, plateNumber: '34XYZ789', modelName: 'Mercedes Sprinter' },
    { id: 3, plateNumber: '35DEF456', modelName: 'Volkswagen Crafter' }
  ];

  const docTypes = docTypesData?.data?.docTypes || [];
  const documents = documentsData?.data?.documents || [];

  // Dosya tipine göre icon
  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith('image/')) {
      return <Image className="w-4 h-4 text-blue-500" />;
    }
    return <FileText className="w-4 h-4 text-gray-500" />;
  };

  // Dosya boyutu formatı
  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Bilinmiyor';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Dosya indirme
  const downloadDocument = async (documentId: number, fileName: string) => {
    try {
      const response = await fetch(`/api/documents/download/${documentId}`);
      
      if (!response.ok) throw new Error('Dosya indirilemedi');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || `document_${documentId}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  // Filtrelenmiş dokümanlar
  const filteredDocuments = documents.filter((doc: any) => {
    const matchesSearch = !searchTerm || 
      doc.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.docTypeName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // API Endpoints Data
  const apiEndpoints = [
    {
      category: "Asset İşlemleri",
      icon: <Package className="w-5 h-5" />,
      endpoints: [
        { method: "GET", path: "/api/assets", description: "Tüm asset'leri listeler" },
        { method: "GET", path: "/api/assets/{id}", description: "Belirli bir asset'in detaylarını getirir" },
        { method: "POST", path: "/api/assets", description: "Yeni asset ekler" },
        { method: "PUT", path: "/api/assets/{id}", description: "Asset bilgilerini günceller" },
        { method: "DELETE", path: "/api/assets/{id}", description: "Asset'i siler (soft delete)" }
      ]
    },
    {
      category: "Şirket İşlemleri",
      icon: <Server className="w-5 h-5" />,
      endpoints: [
        { method: "GET", path: "/api/companies", description: "Tüm şirketleri listeler" },
        { method: "GET", path: "/api/companies/{id}", description: "Şirket detaylarını getirir" },
        { method: "POST", path: "/api/companies", description: "Yeni şirket ekler" },
        { method: "PUT", path: "/api/companies/{id}", description: "Şirket bilgilerini günceller" },
        { method: "DELETE", path: "/api/companies/{id}", description: "Şirketi siler (soft delete)" }
      ]
    },
    {
      category: "Finansal İşlemler",
      icon: <Database className="w-5 h-5" />,
      endpoints: [
        { method: "GET", path: "/api/financial/payment-types", description: "Ödeme türlerini listeler" },
        { method: "GET", path: "/api/financial/current-accounts", description: "Ana finansal işlemleri listeler" },
        { method: "POST", path: "/api/financial/current-accounts", description: "Yeni finansal işlem ekler" },
        { method: "GET", path: "/api/financial/accounts-details", description: "Detay kayıtları listeler" },
        { method: "POST", path: "/api/financial/accounts-details", description: "Yeni detay kayıt ekler" }
      ]
    },
    {
      category: "Yakıt Yönetimi",
      icon: <Database className="w-5 h-5" />,
      endpoints: [
        { method: "GET", path: "/api/fuel-records", description: "Yakıt kayıtlarını listeler" },
        { method: "GET", path: "/api/fuel-records/{id}", description: "Yakıt kaydı detayı" },
        { method: "POST", path: "/api/fuel-records", description: "Yeni yakıt kaydı ekler" },
        { method: "PUT", path: "/api/fuel-records/{id}", description: "Yakıt kaydını günceller" },
        { method: "DELETE", path: "/api/fuel-records/{id}", description: "Yakıt kaydını siler" }
      ]
    },
    {
      category: "Doküman Yönetimi",
      icon: <FileText className="w-5 h-5" />,
      endpoints: [
        { method: "POST", path: "/api/documents", description: "Yeni doküman yükler" },
        { method: "GET", path: "/api/documents/entity/{entityType}/{entityId}", description: "Entity dokümanlarını listeler" },
        { method: "DELETE", path: "/api/documents/{id}", description: "Dokümanı siler" }
      ]
    },
    {
      category: "Toplu İşlemler",
      icon: <Upload className="w-5 h-5" />,
      endpoints: [
        { method: "POST", path: "/api/bulk-import/csv", description: "CSV dosyası ile toplu veri aktarımı" },
        { method: "GET", path: "/api/bulk-import/status/{importId}", description: "Import durumunu kontrol eder" },
        { method: "GET", path: "/api/bulk-import/template/{tableName}", description: "CSV şablonu indirir" },
        { method: "POST", path: "/api/bulk-import/stop-all", description: "Tüm import işlemlerini durdurur" },
        { method: "DELETE", path: "/api/bulk-import/clear-status", description: "Import durumlarını temizler" }
      ]
    },
    {
      category: "Backend API - Hiyerarşik Sistem",
      icon: <Settings className="w-5 h-5" />,
      endpoints: [
        { method: "POST", path: "/api/backend/auth/login", description: "Backend kullanıcı girişi" },
        { method: "GET", path: "/api/backend/assets", description: "Hiyerarşik asset listesi" },
        { method: "GET", path: "/api/backend/personnel", description: "Hiyerarşik personel listesi" },
        { method: "GET", path: "/api/backend/fuel-records", description: "Hiyerarşik yakıt kayıtları" }
      ]
    }
  ];

  const getMethodBadge = (method: string) => {
    const colors = {
      GET: "bg-green-100 text-green-800",
      POST: "bg-blue-100 text-blue-800",
      PUT: "bg-yellow-100 text-yellow-800",
      DELETE: "bg-red-100 text-red-800"
    };
    return colors[method as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Doküman ve API Yönetimi</h1>
        <Badge variant="outline" className="text-sm">
          Açık API Sistemi - filokiapi.architectaiagency.com
        </Badge>
      </div>

      {/* Asset Seçimi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Varlık Seçimi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedAssetId.toString()}
            onValueChange={(value) => setSelectedAssetId(parseInt(value))}
          >
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Varlık seçin" />
            </SelectTrigger>
            <SelectContent>
              {demoAssets.map(asset => (
                <SelectItem key={asset.id} value={asset.id.toString()}>
                  {asset.plateNumber} - {asset.modelName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Tabs defaultValue="api" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            API Endpoint'leri
          </TabsTrigger>
          <TabsTrigger value="upload">Dokuman Yükle</TabsTrigger>
          <TabsTrigger value="list">Doküman Listesi</TabsTrigger>
        </TabsList>

        {/* API Tab */}
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tüm API Endpoint'leri</CardTitle>
              <p className="text-sm text-gray-600">
                Sistem tarafından sunulan tüm API endpoint'lerinin listesi. Tüm endpoint'ler JSON formatında veri döner.
              </p>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-6">
                  {apiEndpoints.map((category, idx) => (
                    <div key={idx} className="space-y-3">
                      <div className="flex items-center gap-2 font-semibold text-lg">
                        {category.icon}
                        <span>{category.category}</span>
                      </div>
                      <div className="space-y-2">
                        {category.endpoints.map((endpoint, endpointIdx) => (
                          <div key={endpointIdx} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            <Badge className={`${getMethodBadge(endpoint.method)} font-mono text-xs px-2 py-1`}>
                              {endpoint.method}
                            </Badge>
                            <div className="flex-1">
                              <code className="text-sm font-mono text-gray-800 dark:text-gray-200">
                                {endpoint.path}
                              </code>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {endpoint.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-4">
          {docTypesLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <DocumentUploader
              assetId={selectedAssetId}
              docTypes={docTypes}
              onUploadSuccess={() => {
                refetchDocuments();
              }}
            />
          )}
        </TabsContent>

        {/* List Tab */}
        <TabsContent value="list" className="space-y-4">
          
          {/* Filtreler */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Dosya adı, açıklama veya kategori ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue placeholder="Kategori filtresi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tüm kategoriler</SelectItem>
                    {docTypes.map((type: any) => 
                      type.subTypes.map((subType: any) => (
                        <SelectItem key={subType.id} value={subType.id.toString()}>
                          {type.name} / {subType.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedDocType('');
                  }}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Temizle
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Doküman Listesi */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Dokümanlar ({filteredDocuments.length})</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchDocuments()}
                  disabled={documentsLoading}
                >
                  Yenile
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documentsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : filteredDocuments.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dosya</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Boyut</TableHead>
                        <TableHead>Tarih</TableHead>
                        <TableHead>Yükleyen</TableHead>
                        <TableHead>İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDocuments.map((doc: any) => (
                        <TableRow key={doc.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {getFileIcon(doc.mimeType)}
                              <div>
                                <p className="font-medium">{doc.fileName || 'Dosya Adı Yok'}</p>
                                {doc.description && (
                                  <p className="text-sm text-gray-500">{doc.description}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{doc.mainTypeName}</p>
                              <p className="text-sm text-gray-500">{doc.docTypeName}</p>
                            </div>
                          </TableCell>
                          <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {new Date(doc.uploadDate).toLocaleDateString('tr-TR')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              {doc.uploaderName || 'Bilinmiyor'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadDocument(doc.id, doc.fileName)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Dokuman Bulunamadı
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Bu varlık için henüz dokuman yüklenmemiş.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DocumentManagement;