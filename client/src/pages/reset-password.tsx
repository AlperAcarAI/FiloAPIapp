import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Shield, Lock, ArrowLeft, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useLocation, useRoute } from 'wouter';

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

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/reset-password/:token');
  const token = params?.token || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setVerifying(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-reset-token/${token}`);
        const data = await response.json();
        setTokenValid(data.valid === true);
      } catch {
        setTokenValid(false);
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Şifre Hatası',
        description: 'Şifreler eşleşmiyor.',
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
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (data.success) {
        setResetSuccess(true);
      } else {
        toast({
          title: 'Hata',
          description: data.message,
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Bağlantı Hatası',
        description: 'Sunucuya bağlanırken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Bağlantı doğrulanıyor...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tokenValid && !resetSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
            <CardTitle className="text-2xl">Geçersiz Bağlantı</CardTitle>
            <CardDescription>
              Bu şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              onClick={() => setLocation('/forgot-password')}
            >
              Yeni Sıfırlama Bağlantısı İste
            </Button>
            <Button
              variant="ghost"
              className="w-full text-gray-600"
              onClick={() => setLocation('/login')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Giriş Sayfasına Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">
            {resetSuccess ? 'Parola Sıfırlandı' : 'Yeni Parola Belirleyin'}
          </CardTitle>
          <CardDescription>
            {resetSuccess
              ? 'Parolanız başarıyla sıfırlanmıştır'
              : 'Hesabınız için yeni bir parola oluşturun'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resetSuccess ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center space-y-3 py-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
                <p className="text-center text-sm text-gray-600">
                  Parolanız başarıyla değiştirildi. Yeni parolanızla giriş
                  yapabilirsiniz.
                </p>
              </div>
              <Button className="w-full" onClick={() => setLocation('/login')}>
                Giriş Yap
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <Label htmlFor="confirm-password">Parola Tekrar</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Parolanızı tekrar girin"
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
                {loading ? 'Sıfırlanıyor...' : 'Parolayı Sıfırla'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
