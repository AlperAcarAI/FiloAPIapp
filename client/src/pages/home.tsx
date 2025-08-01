import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchFilters } from "@/components/search-filters";
import { StatsCards } from "@/components/stats-cards";
import { FileCode, Activity, BarChart3, TestTube, Upload, FileText, Key, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { Header } from "@/components/Header";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  // Gerçek API istatistikleri - 138+ toplam API endpoint
  const stats = { 
    total: 138, 
    active: 138, 
    inactive: 0, 
    error: 0 
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filters */}
        <SearchFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
        />

        <StatsCards stats={stats} />

        {/* API Key Yönetimi */}
        <Card className="shadow-sm border-green-200 bg-green-50 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Key className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="text-lg font-semibold text-green-800">API Key Yönetimi</h3>
                  <p className="text-green-600">
                    Kendi API anahtarlarınızı oluşturun ve yönetin
                  </p>
                </div>
              </div>
              <Link to="/dashboard">
                <Button variant="outline" className="bg-white hover:bg-green-100 text-green-700 border-green-300">
                  <Key className="h-4 w-4 mr-2" />
                  API Key Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* API Test Ortamı */}
        <Card className="shadow-sm border-blue-200 bg-blue-50 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TestTube className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-blue-800">API Center</h3>
                  <p className="text-blue-600">
                    98 API'yi test edin ve dokümantasyonu inceleyin
                  </p>
                </div>
              </div>
              <Link to="/api-center">
                <Button variant="outline" className="bg-white hover:bg-blue-100 text-blue-700 border-blue-300">
                  <TestTube className="h-4 w-4 mr-2" />
                  API Center
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Dokuman Yönetimi */}
        <Card className="shadow-sm border-green-200 bg-green-50 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="text-lg font-semibold text-green-800">Dokuman Yönetimi</h3>
                  <p className="text-green-600">
                    Varlık dokümanlarını yükleyin ve yönetin
                  </p>
                </div>
              </div>
              <Link to="/documents">
                <Button variant="outline" className="bg-white hover:bg-green-100 text-green-700 border-green-300">
                  <Upload className="h-4 w-4 mr-2" />
                  Dokuman Sayfası
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* API Analytics */}
        <Card className="shadow-sm border-purple-200 bg-purple-50 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-purple-600" />
                <div>
                  <h3 className="text-lg font-semibold text-purple-800">API Analytics</h3>
                  <p className="text-purple-600">
                    API kullanım istatistiklerini takip edin
                  </p>
                </div>
              </div>
              <Link to="/analytics">
                <Button variant="outline" className="bg-white hover:bg-purple-100 text-purple-700 border-purple-300">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Analytics Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Swagger API Dokümantasyonu */}
        <Card className="shadow-sm border-indigo-200 bg-indigo-50 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileCode className="h-8 w-8 text-indigo-600" />
                <div>
                  <h3 className="text-lg font-semibold text-indigo-800">API Dokümantasyonu</h3>
                  <p className="text-indigo-600">
                    98 API endpoint'inin detaylı Swagger dokümantasyonu
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="bg-white hover:bg-indigo-100 text-indigo-700 border-indigo-300"
                onClick={() => window.open("/api/docs", "_blank")}
              >
                <FileCode className="h-4 w-4 mr-2" />
                Swagger UI
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Import */}
        <Card className="shadow-sm border-orange-200 bg-orange-50 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Upload className="h-8 w-8 text-orange-600" />
                <div>
                  <h3 className="text-lg font-semibold text-orange-800">Toplu Veri İçe Aktarma</h3>
                  <p className="text-orange-600">
                    28.000+ satırlık Google Sheets verilerinizi sisteme aktarın
                  </p>
                </div>
              </div>
              <Link to="/bulk-import">
                <Button variant="outline" className="bg-white hover:bg-orange-100 text-orange-700 border-orange-300">
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Import
                </Button>
              </Link>
            </div>
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
              <Link to="/api-center">
                <Button
                  variant="outline"
                  className="flex items-center space-x-3 p-4 bg-emerald-50 hover:bg-emerald-100 h-auto justify-start w-full"
                >
                  <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <Activity className="text-white" size={20} />
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-slate-800">API Center</h4>
                    <p className="text-sm text-slate-600">
                      API test ve dokümantasyon merkezi
                    </p>
                  </div>
                </Button>
              </Link>
              <Button
                variant="outline"
                className="flex items-center space-x-3 p-4 bg-purple-50 hover:bg-purple-100 h-auto justify-start"
              >
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <BarChart3 className="text-white" size={20} />
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-slate-800">İstatistikler</h4>
                  <p className="text-sm text-slate-600">
                    API kullanım raporları
                  </p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}