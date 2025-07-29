import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Image, X, CheckCircle, AlertCircle } from 'lucide-react';

interface DocumentUploaderProps {
  assetId: number;
  docTypes: Array<{
    id: number;
    name: string;
    subTypes: Array<{
      id: number;
      name: string;
      mainTypeId: number;
    }>;
  }>;
  onUploadSuccess?: () => void;
}

interface UploadFile extends File {
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ 
  assetId, 
  docTypes, 
  onUploadSuccess 
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [selectedMainType, setSelectedMainType] = useState<number | null>(null);
  const [selectedSubType, setSelectedSubType] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [dragOver, setDragOver] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Dosya tipine göre icon
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-8 h-8 text-blue-500" />;
    }
    return <FileText className="w-8 h-8 text-gray-500" />;
  };

  // Dosya boyutu formatı
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Dosya seçimi/drop işlemi
  const handleFileSelect = (selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles);
    const newFiles: UploadFile[] = fileArray.map(file => ({
      ...file,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending' as const,
      progress: 0
    }));

    // Dosya tipini kontrol et
    const allowedTypes = [
      'application/pdf',
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];

    const validFiles = newFiles.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Desteklenmeyen Dosya',
          description: `${file.name} desteklenmeyen bir dosya formatında.`,
          variant: 'destructive'
        });
        return false;
      }
      if (file.size > 50 * 1024 * 1024) { // 50MB
        toast({
          title: 'Dosya Çok Büyük',
          description: `${file.name} dosyası 50MB'dan büyük olamaz.`,
          variant: 'destructive'
        });
        return false;
      }
      return true;
    });

    setFiles(prev => [...prev, ...validFiles]);
  };

  // Drag & Drop işlemleri
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // Dosya silme
  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Alt kategorileri getir
  const getSubTypes = () => {
    if (!selectedMainType) return [];
    const mainType = docTypes.find(dt => dt.id === selectedMainType);
    return mainType?.subTypes || [];
  };

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSubType) {
        throw new Error('Dokuman kategorisi seçilmeli');
      }

      const formData = new FormData();
      formData.append('assetId', assetId.toString());
      formData.append('docTypeId', selectedSubType.toString());
      if (description) {
        formData.append('description', description);
      }

      // Dosyaları ekle
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/secure/documents/upload', {
        method: 'POST',
        headers: {
          'X-API-Key': '' // API key gerekli
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Upload Başarılı',
        description: `${data.data.successCount} dosya başarıyla yüklendi.`,
      });
      
      // Dosyaları temizle
      setFiles([]);
      setDescription('');
      setSelectedMainType(null);
      setSelectedSubType(null);
      
      // Cache'i invalidate et
      queryClient.invalidateQueries({ queryKey: ['/api/secure/documents/asset', assetId] });
      
      onUploadSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload Hatası',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const canUpload = files.length > 0 && selectedSubType && !uploadMutation.isPending;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Dokuman Yükle
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Kategori Seçimi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Ana Kategori</Label>
            <Select
              value={selectedMainType?.toString()}
              onValueChange={(value) => {
                setSelectedMainType(parseInt(value));
                setSelectedSubType(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Ana kategori seçin" />
              </SelectTrigger>
              <SelectContent>
                {docTypes.map(type => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Alt Kategori</Label>
            <Select
              value={selectedSubType?.toString()}
              onValueChange={(value) => setSelectedSubType(parseInt(value))}
              disabled={!selectedMainType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Alt kategori seçin" />
              </SelectTrigger>
              <SelectContent>
                {getSubTypes().map(subType => (
                  <SelectItem key={subType.id} value={subType.id.toString()}>
                    {subType.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Açıklama */}
        <div className="space-y-2">
          <Label>Açıklama (Opsiyonel)</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Dokuman hakkında kısa açıklama..."
            className="min-h-[80px]"
          />
        </div>

        {/* Drag & Drop Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
              : 'border-gray-300 dark:border-gray-600'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Dosyaları buraya sürükleyin
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            veya
          </p>
          <Button
            variant="outline"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.multiple = true;
              input.accept = '.pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.txt';
              input.onchange = (e) => {
                const target = e.target as HTMLInputElement;
                if (target.files) {
                  handleFileSelect(target.files);
                }
              };
              input.click();
            }}
          >
            Dosya Seç
          </Button>
          <p className="text-xs text-gray-400 mt-4">
            PDF, JPG, PNG, DOC, XLS, TXT • Maksimum 50MB
          </p>
        </div>

        {/* Seçilen Dosyalar */}
        {files.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Seçilen Dosyalar ({files.length})</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {files.map(file => (
                <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  {getFileIcon(file)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                  
                  {file.status === 'pending' && (
                    <Badge variant="secondary">Bekliyor</Badge>
                  )}
                  {file.status === 'uploading' && (
                    <div className="w-16">
                      <Progress value={file.progress} className="h-2" />
                    </div>
                  )}
                  {file.status === 'success' && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {file.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    disabled={uploadMutation.isPending}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Button */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setFiles([]);
              setDescription('');
              setSelectedMainType(null);
              setSelectedSubType(null);
            }}
            disabled={uploadMutation.isPending}
          >
            Temizle
          </Button>
          
          <Button
            onClick={() => uploadMutation.mutate()}
            disabled={!canUpload}
            className="min-w-[120px]"
          >
            {uploadMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Yükleniyor...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Yükle ({files.length})
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentUploader;