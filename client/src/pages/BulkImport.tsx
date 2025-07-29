import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Download, FileText, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ImportStatus {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  totalRows: number;
  processedRows: number;
  progress: number;
  elapsedTime: number;
  estimatedTimeRemaining: number;
  speed: number;
  errors: string[];
}

export default function BulkImport() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetTable, setTargetTable] = useState<string>("");
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // CSV veya Excel kontrolü
      const allowedTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (allowedTypes.includes(file.type)) {
        setSelectedFile(file);
        toast({
          title: "Dosya Seçildi",
          description: `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
        });
      } else {
        toast({
          title: "Hata",
          description: "Sadece CSV veya Excel dosyaları desteklenir",
          variant: "destructive",
        });
      }
    }
  };

  const downloadTemplate = async (tableName: string) => {
    try {
      const response = await fetch(`/api/secure/bulk-import/template/${tableName}`, {
        headers: {
          'X-API-Key': 'ak_test123key'
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${tableName}_template.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Template İndirildi",
          description: `${tableName} template'i başarıyla indirildi`,
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Template indirilemedi",
        variant: "destructive",
      });
    }
  };

  const startImport = async () => {
    if (!selectedFile || !targetTable) {
      toast({
        title: "Hata",
        description: "Lütfen dosya ve hedef tablo seçin",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('targetTable', targetTable);
      formData.append('batchSize', '1000');

      const response = await fetch('/api/secure/bulk-import/csv', {
        method: 'POST',
        body: formData,
        headers: {
          'X-API-Key': 'ak_test123key'
        }
      });

      const result = await response.json();

      if (result.success) {
        const importId = result.data.importId;
        
        toast({
          title: "Import Başlatıldı",
          description: `${result.data.totalRows} satır işlenecek`,
        });

        // Status polling başlat
        pollImportStatus(importId);
      }
    } catch (error) {
      console.error('Import hatası:', error);
      toast({
        title: "Hata",
        description: "Import işlemi başlatılamadı",
        variant: "destructive",
      });
      setImporting(false);
    }
  };

  const pollImportStatus = async (importId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/secure/bulk-import/status/${importId}`, {
          headers: {
            'X-API-Key': 'ak_test123key'
          }
        });

        const result = await response.json();

        if (result.success) {
          setImportStatus(result.data);

          if (result.data.status === 'completed') {
            setImporting(false);
            toast({
              title: "Import Tamamlandı",
              description: `${result.data.totalRows} satır başarıyla işlendi`,
            });
          } else if (result.data.status === 'failed') {
            setImporting(false);
            toast({
              title: "Import Başarısız",
              description: "Import işlemi sırasında hata oluştu",
              variant: "destructive",
            });
          } else {
            // Devam eden import - 2 saniye sonra tekrar kontrol et
            setTimeout(poll, 2000);
          }
        }
      } catch (error) {
        console.error('Status poll hatası:', error);
        setImporting(false);
      }
    };

    poll();
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Toplu Veri İçe Aktarma</h1>
        <p className="text-muted-foreground mt-2">
          28.000+ satırlık Google Sheets verilerinizi sisteme aktarın
        </p>
      </div>

      <div className="grid gap-6">
        {/* Template İndirme */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              1. CSV Template İndirin
            </CardTitle>
            <CardDescription>
              Veri yapınıza uygun CSV template'ini indirin ve Google Sheets verinizi bu formata uyarlayın
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                onClick={() => downloadTemplate('assets')}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Assets Template
              </Button>
              <Button 
                variant="outline" 
                onClick={() => downloadTemplate('personnel')}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Personnel Template
              </Button>
              <Button 
                variant="outline" 
                onClick={() => downloadTemplate('fuel_records')}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Yakıt Template
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Dosya Yükleme */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              2. CSV Dosyasını Yükleyin
            </CardTitle>
            <CardDescription>
              Google Sheets'ten CSV olarak export ettiğiniz dosyayı seçin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="file">CSV Dosyası</Label>
              <Input
                id="file"
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={handleFileSelect}
                className="mt-1"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  Seçilen: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="targetTable">Hedef Tablo</Label>
              <Select value={targetTable} onValueChange={setTargetTable}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Tablo seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assets">Assets (Araçlar/Varlıklar)</SelectItem>
                  <SelectItem value="personnel">Personnel (Personel)</SelectItem>
                  <SelectItem value="fuel_records">Fuel Records (Yakıt Kayıtları)</SelectItem>
                  <SelectItem value="companies">Companies (Şirketler)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={startImport}
              disabled={!selectedFile || !targetTable || importing}
              className="w-full"
            >
              {importing ? "İşleniyor..." : "Import Başlat"}
            </Button>
          </CardContent>
        </Card>

        {/* İlerleme Durumu */}
        {importStatus && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Import Durumu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>İlerleme: {importStatus.processedRows} / {importStatus.totalRows}</span>
                  <span>{importStatus.progress}%</span>
                </div>
                <Progress value={importStatus.progress} className="h-2" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Durum</p>
                  <p className="font-medium capitalize">{importStatus.status}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Hız</p>
                  <p className="font-medium">{importStatus.speed} satır/sn</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Geçen Süre</p>
                  <p className="font-medium">{importStatus.elapsedTime}s</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Kalan Süre</p>
                  <p className="font-medium">{importStatus.estimatedTimeRemaining}s</p>
                </div>
              </div>

              {importStatus.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Hatalar: {importStatus.errors.join(', ')}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Bilgi Kutusu */}
        <Alert>
          <AlertDescription>
            <strong>Önemli Notlar:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>CSV dosyası maksimum 50MB olabilir</li>
              <li>İşleme batch'ler halinde (1000 satır) yapılır</li>
              <li>Hatalı satırlar atlanır ve rapor edilir</li>
              <li>İşlem sırasında sayfayı kapatmayın</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}