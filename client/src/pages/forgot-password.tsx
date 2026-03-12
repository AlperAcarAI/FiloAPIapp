import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Shield, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useLocation } from 'wouter';

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (response.status === 429) {
        toast({
          title: 'Çok Fazla İstek',
          description: data.message,
          variant: 'destructive',
        });
        return;
      }

      // Always show success (user enumeration protection)
      setSubmitted(true);
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

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Şifremi Unuttum</CardTitle>
          <CardDescription>
            {submitted
              ? 'E-posta adresinizi kontrol edin'
              : 'Kayıtlı e-posta adresinizi girin'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center space-y-3 py-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
                <p className="text-center text-sm text-gray-600">
                  Eğer <strong>{email}</strong> adresi sistemde kayıtlı ise,
                  şifre sıfırlama bağlantısı gönderilecektir. Lütfen gelen
                  kutunuzu ve spam klasörünüzü kontrol edin.
                </p>
                <p className="text-center text-xs text-gray-500">
                  Bağlantı 30 dakika geçerlidir.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setLocation('/login')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Giriş Sayfasına Dön
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-posta Adresi</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="ornek@sirket.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-gray-600"
                onClick={() => setLocation('/login')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Giriş Sayfasına Dön
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
