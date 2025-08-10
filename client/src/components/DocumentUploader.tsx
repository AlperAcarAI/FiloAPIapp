import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, X } from 'lucide-react';

interface DocumentUploaderProps {
  entityType?: 'personnel' | 'asset' | 'company' | 'work_area';
  entityId?: number;
  onUploadSuccess?: (document: any) => void;
}

export default function DocumentUploader({ 
  entityType = 'personnel', 
  entityId = 1,
  onUploadSuccess 
}: DocumentUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    docTypeId: '1',
    title: '',
    description: ''
  });
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Dosya boyutu kontrolü (50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "Dosya Çok Büyük",
          description: "Maksimum dosya boyutu 50MB olmalıdır",
          variant: "destructive",
        });
        return;
      }

      // Dosya tipi kontrolü
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'text/plain'
      ];

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Dosya Formatı Desteklenmiyor",
          description: "PDF, DOC, DOCX, XLS, XLSX, JPG, PNG dosyaları kabul edilir",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      // Başlık otomatik doldur
      if (!formData.title) {
        setFormData(prev => ({
          ...prev,
          title: file.name.replace(/\.[^/.]+$/, "")
        }));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Dosya Seçilmedi",
        description: "Lütfen yüklenecek bir dosya seçin",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: "Başlık Gerekli",
        description: "Lütfen döküman için bir başlık girin",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Token'ı localStorage'dan al
      const authToken = localStorage.getItem('authToken');
      
      if (!authToken) {
        toast({
          title: "Oturum Hatası",
          description: "Lütfen tekrar giriş yapın",
          variant: "destructive",
        });
        // Login sayfasına yönlendir
        window.location.href = '/login';
        return;
      }

      // FormData oluştur
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedFile);
      uploadFormData.append('entityType', entityType);
      uploadFormData.append('entityId', entityId.toString());
      uploadFormData.append('docTypeId', formData.docTypeId);
      uploadFormData.append('title', formData.title.trim());
      if (formData.description.trim()) {
        uploadFormData.append('description', formData.description.trim());
      }

      // API çağrısı
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: uploadFormData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Yükleme Başarılı!",
          description: result.message || "Dosya başarıyla yüklendi",
        });

        // Form'u temizle
        setSelectedFile(null);
        setFormData({
          docTypeId: '1',
          title: '',
          description: ''
        });
        
        // File input'u temizle
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';

        // Callback çağır
        if (onUploadSuccess) {
          onUploadSuccess(result.data);
        }

      } else {
        // API error
        toast({
          title: "Yükleme Hatası",
          description: result.message || "Dosya yüklenirken bir hata oluştu",
          variant: "destructive",
        });

        // Token süresi dolmuşsa login'e yönlendir
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Bağlantı Hatası",
        description: "Sunucuya bağlanırken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Döküman Yükleme
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dosya Seçimi */}
        <div className="space-y-2">
          <Label htmlFor="file-upload">Dosya Seç</Label>
          <Input
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
            className="cursor-pointer"
            data-testid="input-file-upload"
          />
          <p className="text-sm text-gray-500">
            Maksimum boyut: 50MB. Desteklenen formatlar: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TXT
          </p>
        </div>

        {/* Seçilen Dosya Gösterimi */}
        {selectedFile && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">{selectedFile.name}</span>
              <span className="text-xs text-gray-500">
                ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removeFile}
              data-testid="button-remove-file"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Döküman Tipi */}
        <div className="space-y-2">
          <Label htmlFor="doc-type">Döküman Tipi</Label>
          <Select 
            value={formData.docTypeId} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, docTypeId: value }))}
          >
            <SelectTrigger data-testid="select-doc-type">
              <SelectValue placeholder="Döküman tipini seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Genel Döküman</SelectItem>
              <SelectItem value="2">Sözleşme</SelectItem>
              <SelectItem value="3">Fatura</SelectItem>
              <SelectItem value="4">Rapor</SelectItem>
              <SelectItem value="5">Kimlik Belgesi</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Başlık */}
        <div className="space-y-2">
          <Label htmlFor="title">Başlık *</Label>
          <Input
            id="title"
            type="text"
            placeholder="Döküman başlığı girin"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            required
            data-testid="input-document-title"
          />
        </div>

        {/* Açıklama */}
        <div className="space-y-2">
          <Label htmlFor="description">Açıklama (İsteğe bağlı)</Label>
          <Input
            id="description"
            type="text"
            placeholder="Döküman açıklaması"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            data-testid="input-document-description"
          />
        </div>

        {/* Yükleme Butonu */}
        <Button 
          onClick={handleUpload}
          disabled={uploading || !selectedFile}
          className="w-full"
          data-testid="button-upload-document"
        >
          {uploading ? 'Yükleniyor...' : 'Dökümanı Yükle'}
        </Button>

        {/* Bilgi */}
        <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
          <p><strong>Entity Type:</strong> {entityType}</p>
          <p><strong>Entity ID:</strong> {entityId}</p>
        </div>
      </CardContent>
    </Card>
  );
}