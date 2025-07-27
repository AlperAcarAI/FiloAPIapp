import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Copy, Eye, EyeOff, Key, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { format } from 'date-fns';

interface ApiKey {
  id: number;
  name: string;
  key: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  lastUsedAt: string | null;
  usageCount: number;
}

const AVAILABLE_PERMISSIONS = [
  { id: 'read', name: 'Okuma', description: 'Tüm verileri okuma izni (şehirler, şirketler, personel vb.)' },
  { id: 'write', name: 'Yazma', description: 'Yeni veri ekleme ve güncelleme izni' },
  { id: 'admin', name: 'Yönetici', description: 'Tüm işlemler (okuma, yazma, silme, güncelleme)' }
];

export default function Dashboard() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [visibleKeys, setVisibleKeys] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Kullanıcının API key'lerini getir
  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ['/api/user/api-keys'],
    queryFn: async () => {
      const response = await fetch('/api/user/api-keys', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    retry: false,
  });

  // Yeni API key oluşturma
  const createKeyMutation = useMutation({
    mutationFn: async (data: { name: string; permissions: string[] }) => {
      const response = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (response) => {
      toast({
        title: 'API Key Oluşturuldu!',
        description: `${newKeyName} başarıyla oluşturuldu.`,
      });
      setShowCreateDialog(false);
      setNewKeyName('');
      setSelectedPermissions([]);
      queryClient.invalidateQueries({ queryKey: ['/api/user/api-keys'] });
      
      // Yeni oluşturulan key'i göster
      if (response?.data?.apiKey?.id) {
        setVisibleKeys(prev => new Set([...Array.from(prev), response.data.apiKey.id]));
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Hata!',
        description: error.message || 'API Key oluşturulamadı.',
        variant: 'destructive',
      });
    },
  });

  // API key silme
  const deleteKeyMutation = useMutation({
    mutationFn: async (keyId: number) => {
      const response = await fetch(`/api/user/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'API Key Silindi',
        description: 'API Key başarıyla silindi.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/api-keys'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Hata!',
        description: error.message || 'API Key silinemedi.',
        variant: 'destructive',
      });
    },
  });

  const copyToClipboard = async (text: string, keyName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Kopyalandı!',
        description: `${keyName} API key'i panoya kopyalandı.`,
      });
    } catch (err) {
      toast({
        title: 'Hata!',
        description: 'Kopyalama işlemi başarısız.',
        variant: 'destructive',
      });
    }
  };

  const toggleKeyVisibility = (keyId: number) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, permissionId]);
    } else {
      setSelectedPermissions(prev => prev.filter(p => p !== permissionId));
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Key Yönetimi</h1>
          <p className="text-muted-foreground">API key'lerinizi oluşturun ve yönetin</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Yeni API Key Oluştur</DialogTitle>
              <DialogDescription>
                API key'inize bir isim verin ve erişim izinlerini seçin.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="keyName">API Key İsmi</Label>
                <Input
                  id="keyName"
                  placeholder="Örn: Mobil Uygulama API"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>
              
              <div className="space-y-3">
                <Label>İzinler</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                  {AVAILABLE_PERMISSIONS.map(permission => (
                    <div key={permission.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={permission.id}
                        checked={selectedPermissions.includes(permission.id)}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(permission.id, checked as boolean)
                        }
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label 
                          htmlFor={permission.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {permission.name}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {permission.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                İptal
              </Button>
              <Button 
                onClick={() => createKeyMutation.mutate({ name: newKeyName, permissions: selectedPermissions })}
                disabled={!newKeyName.trim() || selectedPermissions.length === 0 || createKeyMutation.isPending}
              >
                {createKeyMutation.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {apiKeys.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Key className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Henüz API Key'iniz yok</h3>
            <p className="text-muted-foreground text-center mb-4">
              API'lere erişim için bir API key oluşturun.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              İlk API Key'inizi Oluşturun
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {apiKeys.map((apiKey: ApiKey) => (
            <Card key={apiKey.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CardTitle className="text-lg">{apiKey.name}</CardTitle>
                    <Badge variant={apiKey.isActive ? "default" : "secondary"}>
                      {apiKey.isActive ? "Aktif" : "Pasif"}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteKeyMutation.mutate(apiKey.id)}
                    disabled={deleteKeyMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>
                  Oluşturulma: {format(new Date(apiKey.createdAt), 'dd.MM.yyyy HH:mm')}
                  {apiKey.lastUsedAt && (
                    <> • Son kullanım: {format(new Date(apiKey.lastUsedAt), 'dd.MM.yyyy HH:mm')}</>
                  )}
                  • Kullanım sayısı: {apiKey.usageCount}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type={visibleKeys.has(apiKey.id) ? "text" : "password"}
                      value={apiKey.key}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                    >
                      {visibleKeys.has(apiKey.id) ? 
                        <EyeOff className="h-4 w-4" /> : 
                        <Eye className="h-4 w-4" />
                      }
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(apiKey.key, apiKey.name)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>İzinler</Label>
                  <div className="flex flex-wrap gap-2">
                    {apiKey.permissions.map(permission => (
                      <Badge key={permission} variant="secondary">
                        {AVAILABLE_PERMISSIONS.find(p => p.id === permission)?.name || permission}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}