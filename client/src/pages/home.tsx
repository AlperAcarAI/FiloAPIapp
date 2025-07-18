import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/header";
import { SearchFilters } from "@/components/search-filters";
import { StatsCards } from "@/components/stats-cards";
import { ApiCard } from "@/components/api-card";
import { ApiForm } from "@/components/api-form";
import { apiService } from "@/lib/api";
import { type Api, type InsertApi, type UpdateApi } from "@shared/schema";
import { FileCode, Activity, BarChart3, TestTube } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingApi, setEditingApi] = useState<Api | undefined>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch APIs
  const { data: apis = [], isLoading: apisLoading } = useQuery({
    queryKey: ["/api/apis", searchTerm, statusFilter],
    queryFn: () => apiService.getApis(searchTerm, statusFilter),
  });

  // Fetch stats
  const { data: stats = { total: 0, active: 0, inactive: 0, error: 0 } } = useQuery({
    queryKey: ["/api/apis/stats"],
    queryFn: () => apiService.getStats(),
  });

  // Create API mutation
  const createApiMutation = useMutation({
    mutationFn: (data: InsertApi) => apiService.createApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/apis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/apis/stats"] });
      setShowForm(false);
      toast({
        title: "Başarılı!",
        description: "API başarıyla oluşturuldu.",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata!",
        description: "API oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  // Update API mutation
  const updateApiMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateApi }) =>
      apiService.updateApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/apis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/apis/stats"] });
      setShowForm(false);
      setEditingApi(undefined);
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

  // Delete API mutation
  const deleteApiMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/apis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/apis/stats"] });
      toast({
        title: "Başarılı!",
        description: "API başarıyla silindi.",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata!",
        description: "API silinirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  // Export APIs
  const exportApisMutation = useMutation({
    mutationFn: () => apiService.exportApis(),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "apis.json";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Başarılı!",
        description: "API'ler JSON formatında dışa aktarıldı.",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata!",
        description: "Dışa aktarma sırasında bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const handleNewApi = () => {
    setEditingApi(undefined);
    setShowForm(true);
  };

  const handleEditApi = (api: Api) => {
    setEditingApi(api);
    setShowForm(true);
  };

  const handleDeleteApi = (id: string) => {
    if (window.confirm("Bu API'yi silmek istediğinizden emin misiniz?")) {
      deleteApiMutation.mutate(id);
    }
  };

  const handleFormSubmit = (data: InsertApi | UpdateApi) => {
    if (editingApi) {
      updateApiMutation.mutate({ id: editingApi.api_id, data });
    } else {
      createApiMutation.mutate(data as InsertApi);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        onNewApi={handleNewApi}
        onExport={() => exportApisMutation.mutate()}
      />

      <main className="px-6 py-8">
        <SearchFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
        />

        <StatsCards stats={stats} />

        {/* Test Environment Banner */}
        <Card className="shadow-sm border-emerald-200 bg-emerald-50 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TestTube className="h-8 w-8 text-emerald-600" />
                <div>
                  <h3 className="text-lg font-semibold text-emerald-800">API Test Ortamı</h3>
                  <p className="text-emerald-600">
                    Filo yönetimi API'lerini gerçek verilerle test edin
                  </p>
                </div>
              </div>
              <Link href="/test">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  Test Ortamına Git
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* API List */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800">
              API Listesi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {apisLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-slate-100 rounded-lg h-48 animate-pulse" />
                ))}
              </div>
            ) : apis.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500">Henüz API tanımlanmamış.</p>
                <Button onClick={handleNewApi} className="mt-4">
                  İlk API'nizi Ekleyin
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {apis.map((api) => (
                  <ApiCard
                    key={api.api_id}
                    api={api}
                    onEdit={handleEditApi}
                    onDelete={handleDeleteApi}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mt-8 shadow-sm border-slate-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Hızlı İşlemler
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 h-auto justify-start"
                onClick={() => window.open("/api/docs", "_blank")}
              >
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <FileCode className="text-white" size={20} />
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-slate-800">
                    Swagger Dokümantasyon
                  </h4>
                  <p className="text-sm text-slate-600">
                    API dokümantasyonunu görüntüle
                  </p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="flex items-center space-x-3 p-4 bg-emerald-50 hover:bg-emerald-100 h-auto justify-start"
              >
                <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <Activity className="text-white" size={20} />
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-slate-800">Sistem Durumu</h4>
                  <p className="text-sm text-slate-600">
                    Tüm API'leri kontrol et
                  </p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="flex items-center space-x-3 p-4 bg-amber-50 hover:bg-amber-100 h-auto justify-start"
              >
                <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                  <BarChart3 className="text-white" size={20} />
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-slate-800">Analiz Raporları</h4>
                  <p className="text-sm text-slate-600">
                    Performans ve kullanım
                  </p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <ApiForm
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingApi(undefined);
        }}
        onSubmit={handleFormSubmit}
        api={editingApi}
        loading={createApiMutation.isPending || updateApiMutation.isPending}
      />
    </div>
  );
}
