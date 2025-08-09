import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  FolderOpen
} from 'lucide-react';

const DocumentManagement = () => {
  const [selectedAssetId, setSelectedAssetId] = useState<number>(1); // Demo asset ID
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocType, setSelectedDocType] = useState<string>('');

  // Ana dokuman tiplerini getir
  const { data: mainDocTypesData, isLoading: mainDocTypesLoading } = useQuery({
    queryKey: ['/documents/main-doc-types'],
    queryFn: async () => {
      const response = await fetch('/documents/main-doc-types');
      if (!response.ok) throw new Error('Ana kategoriler yüklenemedi');
      return response.json();
    }
  });

  // Alt dokuman tiplerini getir (selected main type'a göre)
  const [selectedMainType, setSelectedMainType] = useState<string>('');
  const { data: subDocTypesData, isLoading: subDocTypesLoading } = useQuery({
    queryKey: ['/documents/types', selectedMainType],
    queryFn: async () => {
      if (!selectedMainType) return { success: true, data: [] };
      const response = await fetch(`/documents/types/${selectedMainType}`);
      if (!response.ok) throw new Error('Alt kategoriler yüklenemedi');
      return response.json();
    },
    enabled: !!selectedMainType
  });

  // Asset dokümanlarını getir
  const { data: documentsData, isLoading: documentsLoading, refetch: refetchDocuments } = useQuery({
    queryKey: ['/api/secure/documents/asset', selectedAssetId, selectedDocType],
    queryFn: async () => {
      const url = new URL(`/api/secure/documents/asset/${selectedAssetId}`, window.location.origin);
      if (selectedDocType) {
        url.searchParams.set('docTypeId', selectedDocType);
      }
      
      const response = await fetch(url.toString(), {
        headers: {
          'X-API-Key': '' // API key gerekli
        }
      });
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

  const mainDocTypes = mainDocTypesData?.data || [];
  const subDocTypes = subDocTypesData?.data || [];
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
      const response = await fetch(`/api/secure/documents/download/${documentId}`, {
        headers: {
          'X-API-Key': '' // API key gerekli
        }
      });
      
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dokuman Yönetimi</h1>
        <Badge variant="outline" className="text-sm">
          API Korumalı Sistem
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

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Dokuman Yükle</TabsTrigger>
          <TabsTrigger value="list">Doküman Listesi</TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ana Dokuman Kategorileri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mainDocTypesLoading ? (
                  <div className="col-span-full flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : (
                  mainDocTypes.map((mainType: any) => (
                    <Button
                      key={mainType.id}
                      variant={selectedMainType === mainType.id.toString() ? "default" : "outline"}
                      onClick={() => setSelectedMainType(mainType.id.toString())}
                      className="h-auto p-4 text-left justify-start"
                    >
                      <div>
                        <div className="font-medium">{mainType.name}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Ana kategori
                        </div>
                      </div>
                    </Button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {selectedMainType && (
            <Card>
              <CardHeader>
                <CardTitle>Alt Dokuman Tipleri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                  {subDocTypesLoading ? (
                    <div className="col-span-full flex items-center justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : (
                    subDocTypes.map((subType: any) => (
                      <Button
                        key={subType.id}
                        variant="ghost"
                        size="sm"
                        className="h-auto p-3 text-left justify-start text-xs"
                      >
                        {subType.name}
                      </Button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
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
                    {subDocTypes.map((subType: any) => (
                      <SelectItem key={subType.id} value={subType.id.toString()}>
                        {subType.name}
                      </SelectItem>
                    ))}
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