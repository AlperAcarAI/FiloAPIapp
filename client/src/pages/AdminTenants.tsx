import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Building2, Plus, Activity, AlertTriangle } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminTenants() {
  const [newTenantData, setNewTenantData] = useState({
    name: "",
    subdomain: "",
    databaseUrl: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Tenant listesini getir
  const { data: tenantsData, isLoading } = useQuery({
    queryKey: ['/api/tenant/list'],
    enabled: true
  });

  // Yeni tenant oluşturma mutation
  const createTenantMutation = useMutation({
    mutationFn: async (tenantData: typeof newTenantData) => {
      const response = await fetch('/api/tenant/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tenantData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Şirket oluşturulamadı');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Yeni şirket başarıyla oluşturuldu.",
      });
      setNewTenantData({ name: "", subdomain: "", databaseUrl: "" });
      queryClient.invalidateQueries({ queryKey: ['/api/tenant/list'] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Şirket oluşturulamadı.",
      });
    }
  });

  // Tenant deaktif etme mutation
  const deactivateTenantMutation = useMutation({
    mutationFn: async (subdomain: string) => {
      const response = await fetch(`/api/tenant/${subdomain}/deactivate`, {
        method: 'PATCH'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Şirket deaktif edilemedi');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Şirket deaktif edildi.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tenant/list'] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Şirket deaktif edilemedi.",
      });
    }
  });

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantData.name || !newTenantData.subdomain) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Şirket adı ve subdomain zorunludur.",
      });
      return;
    }

    createTenantMutation.mutate(newTenantData);
  };

  const tenants = tenantsData?.tenants || [];

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center gap-3">
        <Building2 className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Şirket Yönetimi</h1>
          <p className="text-muted-foreground">
            Multi-tenant sistemdeki şirketleri yönetin
          </p>
        </div>
      </div>

      {/* Yeni Şirket Oluşturma Formu */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Yeni Şirket Ekle
          </CardTitle>
          <CardDescription>
            Sisteme yeni bir şirket ekleyin. Her şirket kendi veritabanını kullanacak.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateTenant} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Şirket Adı</Label>
                <Input
                  id="name"
                  value={newTenantData.name}
                  onChange={(e) => setNewTenantData(prev => ({
                    ...prev,
                    name: e.target.value
                  }))}
                  placeholder="Örn: ABC Şirketi"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomain</Label>
                <Input
                  id="subdomain"
                  value={newTenantData.subdomain}
                  onChange={(e) => setNewTenantData(prev => ({
                    ...prev,
                    subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                  }))}
                  placeholder="abc"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Erişim URL: {newTenantData.subdomain || 'subdomain'}.yourdomain.com
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="databaseUrl">Database URL (Opsiyonel)</Label>
              <Input
                id="databaseUrl"
                type="password"
                value={newTenantData.databaseUrl}
                onChange={(e) => setNewTenantData(prev => ({
                  ...prev,
                  databaseUrl: e.target.value
                }))}
                placeholder="Boş bırakılırsa varsayılan database kullanılır"
              />
            </div>
            <Button
              type="submit"
              disabled={createTenantMutation.isPending}
              className="w-full md:w-auto"
            >
              {createTenantMutation.isPending ? "Oluşturuluyor..." : "Şirket Oluştur"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Mevcut Şirketler Listesi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Mevcut Şirketler ({tenants.length})
          </CardTitle>
          <CardDescription>
            Sistemdeki tüm şirketleri görüntüleyin ve yönetin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : tenants.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Henüz şirket eklenmemiş.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tenants.map((tenant: Tenant) => (
                <Card key={tenant.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{tenant.name}</CardTitle>
                        <CardDescription>
                          {tenant.subdomain}.yourdomain.com
                        </CardDescription>
                      </div>
                      <Badge variant={tenant.isActive ? "default" : "secondary"}>
                        {tenant.isActive ? (
                          <><Activity className="h-3 w-3 mr-1" />Aktif</>
                        ) : (
                          <><AlertTriangle className="h-3 w-3 mr-1" />Pasif</>
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div>
                        <strong>ID:</strong> {tenant.id}
                      </div>
                      <div>
                        <strong>Oluşturulma:</strong> {new Date(tenant.createdAt).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                    {tenant.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-4"
                        onClick={() => deactivateTenantMutation.mutate(tenant.subdomain)}
                        disabled={deactivateTenantMutation.isPending}
                      >
                        {deactivateTenantMutation.isPending ? "Deaktif Ediliyor..." : "Deaktif Et"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}