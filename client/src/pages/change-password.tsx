import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { Lock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumbers: boolean;
  hasSpecialChars: boolean;
  noCommonWords: boolean;
}

function getPasswordRequirements(password: string): PasswordRequirements {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    noCommonWords: !/(password|123456|qwerty|admin|user)/i.test(password),
  };
}

function PasswordStrengthIndicator({ password }: { password: string }) {
  if (!password) return null;

  const reqs = getPasswordRequirements(password);
  const score = Object.values(reqs).filter(Boolean).length;

  const items = [
    { key: 'minLength', label: 'En az 8 karakter' },
    { key: 'hasUppercase', label: 'Büyük harf (A-Z)' },
    { key: 'hasLowercase', label: 'Küçük harf (a-z)' },
    { key: 'hasNumbers', label: 'Rakam (0-9)' },
    { key: 'hasSpecialChars', label: 'Özel karakter (!@#$...)' },
  ] as const;

  const barColor = score <= 2 ? 'bg-red-500' : score <= 4 ? 'bg-yellow-500' : 'bg-green-500';
  const barWidth = `${(score / 6) * 100}%`;

  return (
    <div className="space-y-2">
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: barWidth }}
        />
      </div>
      <ul className="space-y-1">
        {items.map(({ key, label }) => (
          <li key={key} className="flex items-center text-xs gap-1.5">
            {reqs[key] ? (
              <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
            ) : (
              <XCircle className="h-3 w-3 text-gray-400 flex-shrink-0" />
            )}
            <span className={reqs[key] ? 'text-green-700' : 'text-gray-500'}>
              {label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ChangePassword() {
  const [, setLocation] = useLocation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Şifre Hatası',
        description: 'Yeni şifreler eşleşmiyor.',
        variant: 'destructive',
      });
      return;
    }

    const reqs = getPasswordRequirements(newPassword);
    const score = Object.values(reqs).filter(Boolean).length;
    if (score < 4) {
      toast({
        title: 'Zayıf Parola',
        description: 'Lütfen daha güçlü bir parola seçin.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        toast({
          title: 'Sunucu Hatası',
          description: 'Beklenmeyen bir yanıt alındı. Lütfen sayfayı yenileyip tekrar deneyin.',
          variant: 'destructive',
        });
        return;
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Parola Değiştirildi',
          description: data.message,
        });

        // Clear tokens (all sessions revoked by backend)
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        // Redirect to login
        setTimeout(() => setLocation('/login'), 2000);
      } else {
        // Hata koduna göre açıklayıcı mesajlar
        const errorMessages: Record<string, string> = {
          WRONG_PASSWORD: 'Girdiğiniz mevcut parola hatalı. Lütfen tekrar deneyin.',
          WEAK_PASSWORD: data.data?.suggestions?.join(', ') || 'Yeni parola yeterince güçlü değil. Lütfen daha güçlü bir parola seçin.',
          PASSWORD_REUSED: 'Bu parolayı yakın zamanda kullandınız. Farklı bir parola seçin.',
          ACCOUNT_LOCKED: 'Hesabınız geçici olarak kilitlendi. Lütfen birkaç dakika bekleyip tekrar deneyin.',
          PASSWORD_RESET_REQUIRED: 'Parolanız doğrulanamıyor. Lütfen "Şifremi Unuttum" seçeneğini kullanarak yeni bir parola belirleyin.',
          UNAUTHORIZED: 'Oturumunuz sona ermiş. Lütfen tekrar giriş yapın.',
        };

        const message = errorMessages[data.error] || data.message || 'Parola değiştirme işlemi başarısız oldu.';

        toast({
          title: 'Parola Değiştirilemedi',
          description: message,
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Bağlantı Hatası',
        description: 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="flex items-center justify-center p-4 mt-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-6 w-6 text-blue-600" />
              <CardTitle className="text-xl">Parola Değiştir</CardTitle>
            </div>
            <CardDescription>
              Güvenliğiniz için mevcut parolanızı doğrulamanız gerekiyor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Mevcut Parola</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="current-password"
                    type="password"
                    placeholder="Mevcut parolanızı girin"
                    className="pl-10"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">Yeni Parola</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Yeni parolanızı girin"
                    className="pl-10"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <PasswordStrengthIndicator password={newPassword} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Yeni Parola Tekrar</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Yeni parolanızı tekrar girin"
                    className="pl-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    Parolalar eşleşmiyor
                  </p>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Parolalar eşleşiyor
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || newPassword !== confirmPassword}
              >
                {loading ? 'Değiştiriliyor...' : 'Parolayı Değiştir'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-gray-600"
                onClick={() => setLocation('/')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Ana Sayfaya Dön
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
