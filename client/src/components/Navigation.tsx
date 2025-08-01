import { Button } from '@/components/ui/button';
import { LogOut, Home, Settings, Database, BarChart3, Upload, FolderOpen } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

export default function Navigation() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
      
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      toast({
        title: "Çıkış Başarılı",
        description: "Güvenli bir şekilde çıkış yaptınız",
      });
      
      setLocation('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local storage and redirect
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setLocation('/login');
    }
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const navItems = [
    { href: '/', icon: Home, label: 'Ana Sayfa' },
    { href: '/dashboard', icon: BarChart3, label: 'Dashboard' },
    { href: '/api-center', icon: Database, label: 'API Center' },
    { href: '/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/documents', icon: FolderOpen, label: 'Dökümanlar' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Filo Yönetim Sistemi</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              {user.email || user.username || 'Kullanıcı'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Çıkış</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}