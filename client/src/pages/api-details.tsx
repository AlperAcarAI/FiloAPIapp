import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api";
import { ArrowLeft, Edit, Play, FileCode, Activity } from "lucide-react";
import { useState } from "react";
import { ApiForm } from "@/components/api-form";
import { type UpdateApi } from "@shared/schema";

export default function ApiDetails() {
  const { id } = useParams<{ id: string }>();
  const [showEditForm, setShowEditForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: api, isLoading } = useQuery({
    queryKey: ["/api/apis", id],
    queryFn: () => apiService.getApi(id!),
    enabled: !!id,
  });

  const updateApiMutation = useMutation({
    mutationFn: (data: UpdateApi) => apiService.updateApi(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/apis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/apis/stats"] });
      setShowEditForm(false);
      toast({
        title: "Başarılı!",
        description: "API başarıyla güncellendi.",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata!",
        description: "API güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="px-6 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64 bg-slate-200 rounded"></div>
              <div className="h-64 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!api) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              API Bulunamadı
            </h1>
            <p className="text-slate-600 mb-4">
              Aradığınız API mevcut değil veya silinmiş olabilir.
            </p>
            <Link href="/">
              <Button>Ana Sayfaya Dön</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aktif":
        return "bg-emerald-100 text-emerald-800";
      case "pasif":
        return "bg-amber-100 text-amber-800";
      case "hata":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "aktif":
        return "Aktif";
      case "pasif":
        return "Pasif";
      case "hata":
        return "Hata";
      default:
        return status;
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Henüz çalışmadı";
    return new Date(date).toLocaleString("tr-TR");
  };

  const formatLastRun = (date: Date | null) => {
    if (!date) return "Henüz çalışmadı";
    
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Az önce";
    if (minutes < 60) return `${minutes} dakika önce`;
    if (hours < 24) return `${hours} saat önce`;
    return `${days} gün önce`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="outline" size="icon">
                <ArrowLeft size={16} />
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-slate-800">{api.ad}</h1>
              <Badge className={getStatusColor(api.durum)}>
                <span className="w-2 h-2 bg-current rounded-full mr-1"></span>
                {getStatusText(api.durum)}
              </Badge>
            </div>
          </div>
          <Button onClick={() => setShowEditForm(true)}>
            <Edit size={16} className="mr-2" />
            Düzenle
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Temel Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">API ID:</span>
                  <span className="text-sm font-mono text-slate-800">
                    {api.api_id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Oluşturulma:</span>
                  <span className="text-sm text-slate-800">
                    {formatDate(api.created_at)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Son Güncelleme:</span>
                  <span className="text-sm text-slate-800">
                    {formatDate(api.updated_at)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Son Çalışma:</span>
                  <span className="text-sm text-slate-800">
                    {formatLastRun(api.son_calistigi)}
                  </span>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-slate-800 mb-2">Açıklama</h4>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-700">{api.aciklama}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performans Metrikleri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Uptime:</span>
                  <span className="text-sm font-semibold text-emerald-600">
                    99.9%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">
                    Ortalama Yanıt Süresi:
                  </span>
                  <span className="text-sm text-slate-800">120ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Günlük İstek:</span>
                  <span className="text-sm text-slate-800">2.4K</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Hata Oranı:</span>
                  <span className="text-sm text-slate-800">0.1%</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-slate-800 mb-2">
                  Hızlı İşlemler
                </h4>
                <div className="space-y-2">
                  <Button className="w-full" size="sm">
                    <Play size={16} className="mr-2" />
                    Test Et
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    size="sm"
                    onClick={() => window.open("/api/docs", "_blank")}
                  >
                    <FileCode size={16} className="mr-2" />
                    Swagger Dokümantasyon
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    size="sm"
                    onClick={() => setShowEditForm(true)}
                  >
                    <Edit size={16} className="mr-2" />
                    Düzenle
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ApiForm
        open={showEditForm}
        onClose={() => setShowEditForm(false)}
        onSubmit={(data) => updateApiMutation.mutate(data)}
        api={api}
        loading={updateApiMutation.isPending}
      />
    </div>
  );
}
