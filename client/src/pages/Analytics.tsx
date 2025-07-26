import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Activity, TrendingUp, Clock, AlertTriangle, Database, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function Analytics() {
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const [selectedEndpoint, setSelectedEndpoint] = useState("");

  // API Genel İstatistikleri
  const { data: overviewStats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['/api/analytics/stats/overview'],
    retry: false,
  });

  // Endpoint İstatistikleri  
  const { data: endpointStats, isLoading: endpointsLoading } = useQuery({
    queryKey: ['/api/analytics/stats/endpoints', selectedEndpoint],
    enabled: !!selectedEndpoint,
    retry: false,
  });

  // Günlük Kullanım Trendi
  const { data: dailyStats, isLoading: dailyLoading } = useQuery({
    queryKey: ['/api/analytics/stats/daily', { days: selectedPeriod }],
    retry: false,
  });

  // En Yavaş Endpoint'ler
  const { data: slowestEndpoints, isLoading: slowestLoading } = useQuery({
    queryKey: ['/api/analytics/stats/slowest'],
    retry: false,
  });

  // Hata Analizi
  const { data: errorStats, isLoading: errorsLoading } = useQuery({
    queryKey: ['/api/analytics/stats/errors'],
    retry: false,
  });

  // Son API Logları
  const { data: recentLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['/api/analytics/logs', { page: 1, limit: 20 }],
    retry: false,
  });

  const handleRefreshAll = () => {
    refetchStats();
    window.location.reload(); // Tüm verileri yenile
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">API Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            API kullanım istatistikleri ve performans analizleri
          </p>
        </div>
        <Button onClick={handleRefreshAll} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Yenile
        </Button>
      </div>

      {/* Genel İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam İstek</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : overviewStats?.data?.totalRequests || "0"}
            </div>
            <p className="text-xs text-muted-foreground">Son 30 gün</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Başarı Oranı</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statsLoading ? "..." : `${overviewStats?.data?.successRate || "0"}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              {overviewStats?.data?.successRequests || "0"} başarılı istek
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ort. Yanıt Süresi</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : `${overviewStats?.data?.avgResponseTime || "0"}ms`}
            </div>
            <p className="text-xs text-muted-foreground">Ortalama süre</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Endpoint</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : overviewStats?.data?.topEndpoints?.length || "0"}
            </div>
            <p className="text-xs text-muted-foreground">Farklı endpoint</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoint'ler</TabsTrigger>
          <TabsTrigger value="performance">Performans</TabsTrigger>
          <TabsTrigger value="errors">Hatalar</TabsTrigger>
          <TabsTrigger value="logs">Log Kayıtları</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* En Çok Kullanılan Endpoint'ler */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  En Çok Kullanılan API'ler
                </CardTitle>
                <CardDescription>Son 30 günün popüler endpoint'leri</CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="text-center py-4">Yükleniyor...</div>
                ) : (
                  <div className="space-y-3">
                    {overviewStats?.data?.topEndpoints?.map((endpoint: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{endpoint.method}</Badge>
                          <span className="text-sm font-mono">{endpoint.endpoint}</span>
                        </div>
                        <span className="text-sm font-semibold">{endpoint.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Günlük Kullanım Trendi */}
            <Card>
              <CardHeader>
                <CardTitle>Günlük Kullanım Trendi</CardTitle>
                <CardDescription>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Son 7 gün</SelectItem>
                      <SelectItem value="30">Son 30 gün</SelectItem>
                      <SelectItem value="90">Son 90 gün</SelectItem>
                    </SelectContent>
                  </Select>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dailyLoading ? (
                  <div className="text-center py-4">Yükleniyor...</div>
                ) : (
                  <div className="space-y-2">
                    {dailyStats?.data?.slice(0, 5)?.map((day: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span>{day.date}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-green-600">{day.totalRequests || 0}</span>
                          <span className="text-gray-500">{day.avgResponseTime || 0}ms</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                En Yavaş Endpoint'ler
              </CardTitle>
              <CardDescription>Yanıt süresine göre performans analizi</CardDescription>
            </CardHeader>
            <CardContent>
              {slowestLoading ? (
                <div className="text-center py-4">Yükleniyor...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Method</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Ort. Süre</TableHead>
                      <TableHead>Max Süre</TableHead>
                      <TableHead>İstek Sayısı</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slowestEndpoints?.data?.map((endpoint: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Badge variant="outline">{endpoint.method}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{endpoint.endpoint}</TableCell>
                        <TableCell className="text-orange-600 font-semibold">
                          {Number(endpoint.avgResponseTime).toFixed(0)}ms
                        </TableCell>
                        <TableCell className="text-red-600">
                          {endpoint.maxResponseTime}ms
                        </TableCell>
                        <TableCell>{endpoint.requestCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Hata Analizi
              </CardTitle>
              <CardDescription>Son 7 günün hata istatistikleri</CardDescription>
            </CardHeader>
            <CardContent>
              {errorsLoading ? (
                <div className="text-center py-4">Yükleniyor...</div>
              ) : errorStats?.data?.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status Code</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Hata Sayısı</TableHead>
                      <TableHead>Son Hata</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {errorStats.data.map((error: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Badge variant="destructive">{error.statusCode}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{error.method}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{error.endpoint}</TableCell>
                        <TableCell className="text-red-600 font-semibold">{error.errorCount}</TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {new Date(error.lastError).toLocaleDateString('tr-TR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Son 7 günde hata kaydı bulunamadı 🎉
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Son API Çağrıları</CardTitle>
              <CardDescription>Detaylı istek logları</CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="text-center py-4">Yükleniyor...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Zaman</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Süre</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentLogs?.data?.logs?.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {new Date(log.timestamp).toLocaleString('tr-TR')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.method}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{log.endpoint}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={log.statusCode < 300 ? "default" : log.statusCode < 400 ? "secondary" : "destructive"}
                          >
                            {log.statusCode}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          <span className={log.responseTime > 1000 ? "text-red-600" : log.responseTime > 500 ? "text-orange-600" : "text-green-600"}>
                            {log.responseTime}ms
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">{log.ipAddress || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}