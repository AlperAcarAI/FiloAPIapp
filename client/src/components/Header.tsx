import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Database, 
  BarChart3, 
  FileText, 
  Key, 
  TestTube,
  Menu,
  X,
  LogOut
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function Header() {
  const [location] = useLocation();
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setLocation('/login');
    }
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const navigation = [
    { name: "Ana Sayfa", href: "/", icon: Home },
    { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
    { name: "API Center", href: "/api-center", icon: Database },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Dokümanlar", href: "/documents", icon: FileText },
  ];

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo ve Site Adı */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Database className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Filoki Api</h1>
                <p className="text-sm text-gray-500 hidden sm:block">API Management Platform</p>
              </div>
            </Link>
            
            {/* Status Badge */}
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hidden md:flex">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              138+ API Active
            </Badge>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <nav className="flex space-x-1">
              {navigation.map((item, index) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <Link key={index} href={item.href}>
                    <Button
                      variant={active ? "default" : "ghost"}
                      size="sm"
                      className={`flex items-center space-x-2 transition-all duration-200 ${
                        active 
                          ? "bg-blue-600 text-white shadow-md" 
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden lg:block">{item.name}</span>
                    </Button>
                  </Link>
                );
              })}
            </nav>
            
            {/* User Info & Logout */}
            <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-200">
              <span className="text-sm text-gray-600 hidden lg:block">
                {user.email || user.username || 'Kullanıcı'}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden lg:block">Çıkış</span>
              </Button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-600"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item, index) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <Link key={index} href={item.href}>
                    <Button
                      variant={active ? "default" : "ghost"}
                      size="sm"
                      className={`w-full justify-start space-x-3 ${
                        active 
                          ? "bg-blue-600 text-white" 
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Button>
                  </Link>
                );
              })}
              
              {/* Mobile User & Logout */}
              <div className="pt-3 border-t border-gray-200 space-y-2">
                <div className="px-3 py-2 text-sm text-gray-600">
                  {user.email || user.username || 'Kullanıcı'}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full justify-start space-x-3 text-gray-600 hover:text-gray-900"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Çıkış</span>
                </Button>
                
                {/* Mobile Status */}
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  138+ API Aktif
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}