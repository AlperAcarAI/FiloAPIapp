import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Shield, User, Lock } from 'lucide-react';
import { useLocation } from 'wouter';

interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: {
      id: number;
      username: string;
    };
  };
}

export default function Login() {
  const [, setLocation] = useLocation();
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({ username: '', password: '', confirmPassword: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: loginData.username, 
          password: loginData.password 
        }),
      });

      const data: AuthResponse = await response.json();

      if (data.success && data.data) {
        localStorage.setItem('authToken', data.data.accessToken);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        toast({
          title: "Giriş Başarılı!",
          description: data.message,
        });
        
        setLocation('/');
      } else {
        toast({
          title: "Giriş Hatası",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Bağlantı Hatası",
        description: "Sunucuya bağlanırken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Şifre Hatası",
        description: "Şifreler eşleşmiyor",
        variant: "destructive",
      });
      return;
    }

    setRegisterLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: registerData.username,
          password: registerData.password,
        }),
      });

      const data: AuthResponse = await response.json();

      if (data.success && data.data) {
        toast({
          title: "Kayıt Başarılı!",
          description: data.message,
        });
        
        // After successful registration, user needs to login
        setRegisterData({ username: '', password: '', confirmPassword: '' });
      } else {
        toast({
          title: "Kayıt Hatası",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Bağlantı Hatası",
        description: "Sunucuya bağlanırken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Filo Yönetim Sistemi</CardTitle>
          <CardDescription>
            Güvenli sistem erişimi için giriş yapın
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Giriş Yap</TabsTrigger>
              <TabsTrigger value="register">Kayıt Ol</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username">Kullanıcı Adı</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="login-username"
                      type="text"
                      placeholder="Kullanıcı adınızı girin"
                      className="pl-10"
                      value={loginData.username}
                      onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password">Şifre</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Şifrenizi girin"
                      className="pl-10"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loginLoading}
                >
                  {loginLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-4">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-username">Kullanıcı Adı</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="register-username"
                      type="text"
                      placeholder="Kullanıcı adınızı girin"
                      className="pl-10"
                      value={registerData.username}
                      onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-password">Şifre</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Şifrenizi girin (min 6 karakter)"
                      className="pl-10"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-confirm-password">Şifre Tekrar</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="register-confirm-password"
                      type="password"
                      placeholder="Şifrenizi tekrar girin"
                      className="pl-10"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={registerLoading}
                >
                  {registerLoading ? 'Kayıt Yapılıyor...' : 'Kayıt Ol'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-sm text-green-800 mb-2">Varsayılan Admin Girişi:</h3>
            <div className="space-y-1">
              <div className="text-xs">
                <span className="font-medium">Kullanıcı Adı:</span>
                <code className="ml-2 bg-white px-2 py-1 rounded border">Admin</code>
              </div>
              <div className="text-xs">
                <span className="font-medium">Şifre:</span>
                <code className="ml-2 bg-white px-2 py-1 rounded border">Architect</code>
              </div>
            </div>
            <p className="text-xs text-green-600 mt-2">
              İlk giriş için bu bilgileri kullanın
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}