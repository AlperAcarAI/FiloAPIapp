import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { publicApi, backendApi, authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, CheckCircle, XCircle, Clock, Database, Shield, Globe, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ApiTest {
  name: string;
  description: string;
  endpoint: string;
  status: 'success' | 'error' | 'pending';
  responseTime?: number;
  lastChecked?: Date;
  errorMessage?: string;
  category: 'public' | 'auth' | 'backend' | 'admin';
}

export default function ApiStatus() {
  const { data: overview } = useQuery({
    queryKey: ['/api/overview'],
    queryFn: () => publicApi.getOverview()
  });

  const { data: endpoints = [] } = useQuery({
    queryKey: ['/api/endpoints'],
    queryFn: () => publicApi.getEndpoints()
  });

  const [tests, setTests] = useState<ApiTest[]>([
    {
      name: 'Cities API',
      description: 'Get Turkish cities with filtering',
      endpoint: '/api/getCities',
      status: 'pending',
      category: 'public'
    },
    {
      name: 'Swagger Documentation',
      description: 'API documentation and schema',
      endpoint: '/api/docs',
      status: 'pending',
      category: 'public'
    },
    {
      name: 'API Endpoints List',
      description: 'List all available endpoints',
      endpoint: '/api/endpoints',
      status: 'pending',
      category: 'public'
    },
    {
      name: 'Authentication Test',
      description: 'Verify authentication system',
      endpoint: '/api/test-auth',
      status: 'pending',
      category: 'auth'
    },
    {
      name: 'Backend Login',
      description: 'JWT-based hierarchical authentication',
      endpoint: '/api/backend/auth/login',
      status: 'pending',
      category: 'backend'
    },
    {
      name: 'Personnel Data',
      description: 'Access personnel with permissions',
      endpoint: '/api/backend/personnel',
      status: 'pending',
      category: 'backend'
    },
    {
      name: 'Work Areas',
      description: 'Hierarchical work area access',
      endpoint: '/api/backend/work-areas',
      status: 'pending',
      category: 'backend'
    }
  ]);
  
  const { toast } = useToast();

  const runApiTest = async (test: ApiTest): Promise<ApiTest> => {
    const startTime = Date.now();
    
    try {
      let response;
      
      switch (test.endpoint) {
        case '/api/getCities':
          response = await publicApi.getCities({ limit: 5 });
          break;
          
        case '/api/docs':
          response = await publicApi.getSwaggerDocs();
          break;
          
        case '/api/endpoints':
          response = await publicApi.getEndpoints();
          break;
          
        case '/api/test-auth':
          const authResponse = await fetch('/api/test-auth');
          response = await authResponse.json();
          break;
          
        case '/api/backend/auth/login':
          response = await backendApi.login('test@example.com', 'test123');
          break;
          
        case '/api/backend/personnel':
          // First get a token
          const loginResponse = await backendApi.login('test@example.com', 'test123');
          if (loginResponse.success) {
            response = await backendApi.getPersonnel(loginResponse.data.token, { limit: 5 });
          } else {
            throw new Error('Login failed');
          }
          break;
          
        case '/api/backend/work-areas':
          // First get a token
          const workAreaLoginResponse = await backendApi.login('test@example.com', 'test123');
          if (workAreaLoginResponse.success) {
            response = await backendApi.getWorkAreas(workAreaLoginResponse.data.token);
          } else {
            throw new Error('Login failed');
          }
          break;
          
        default:
          const fetchResponse = await fetch(test.endpoint);
          response = await fetchResponse.json();
      }
      
      const responseTime = Date.now() - startTime;
      
      return {
        ...test,
        status: 'success',
        responseTime,
        lastChecked: new Date(),
        errorMessage: undefined
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        ...test,
        status: 'error',
        responseTime,
        lastChecked: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const runAllTests = async () => {
    setTests(prev => prev.map(test => ({ ...test, status: 'pending' as const })));
    
    const results = await Promise.all(tests.map(runApiTest));
    setTests(results);
    
    const successCount = results.filter(r => r.status === 'success').length;
    toast({
      title: 'API Tests Complete',
      description: `${successCount}/${results.length} tests passed`,
      variant: successCount === results.length ? 'default' : 'destructive'
    });
  };

  const runSingleTest = async (testIndex: number) => {
    const test = tests[testIndex];
    setTests(prev => prev.map((t, i) => i === testIndex ? { ...t, status: 'pending' as const } : t));
    
    const result = await runApiTest(test);
    setTests(prev => prev.map((t, i) => i === testIndex ? result : t));
  };

  useEffect(() => {
    runAllTests();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500 animate-spin" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'public': return <Globe className="w-4 h-4" />;
      case 'auth': return <Shield className="w-4 h-4" />;
      case 'backend': return <Database className="w-4 h-4" />;
      case 'admin': return <Users className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'error': return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800">Testing</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const categoryTests = {
    public: tests.filter(t => t.category === 'public'),
    auth: tests.filter(t => t.category === 'auth'),
    backend: tests.filter(t => t.category === 'backend'),
    admin: tests.filter(t => t.category === 'admin')
  };

  const overallStats = {
    total: tests.length,
    success: tests.filter(t => t.status === 'success').length,
    error: tests.filter(t => t.status === 'error').length,
    pending: tests.filter(t => t.status === 'pending').length
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">FiloApi System Status</h1>
          <p className="text-gray-600 mt-2">Real-time monitoring of all {overview?.totalEndpoints || 98} API endpoints</p>
        </div>
        <Button onClick={runAllTests} disabled={overallStats.pending > 0}>
          <RefreshCw className={`w-4 h-4 mr-2 ${overallStats.pending > 0 ? 'animate-spin' : ''}`} />
          Run All Tests
        </Button>
      </div>

      {/* Overall Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total APIs</p>
                <p className="text-2xl font-bold">{overview?.totalEndpoints || overallStats.total}</p>
              </div>
              <Database className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{overallStats.success}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Errors</p>
                <p className="text-2xl font-bold text-red-600">{overallStats.error}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Testing</p>
                <p className="text-2xl font-bold text-yellow-600">{overallStats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All APIs</TabsTrigger>
          <TabsTrigger value="public">
            <Globe className="w-4 h-4 mr-2" />
            Public ({categoryTests.public.length})
          </TabsTrigger>
          <TabsTrigger value="auth">
            <Shield className="w-4 h-4 mr-2" />
            Auth ({categoryTests.auth.length})
          </TabsTrigger>
          <TabsTrigger value="backend">
            <Database className="w-4 h-4 mr-2" />
            Backend ({categoryTests.backend.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4">
            {tests.map((test, index) => (
              <Card key={test.endpoint}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getCategoryIcon(test.category)}
                      <div>
                        <CardTitle className="text-lg">{test.name}</CardTitle>
                        <CardDescription>{test.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(test.status)}
                      {getStatusIcon(test.status)}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => runSingleTest(index)}
                        disabled={test.status === 'pending'}
                      >
                        Test
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <code className="bg-gray-100 px-2 py-1 rounded">{test.endpoint}</code>
                    <div className="flex items-center space-x-4">
                      {test.responseTime && (
                        <span>{test.responseTime}ms</span>
                      )}
                      {test.lastChecked && (
                        <span>Last: {test.lastChecked.toLocaleTimeString()}</span>
                      )}
                    </div>
                  </div>
                  {test.errorMessage && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                      {test.errorMessage}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {Object.entries(categoryTests).map(([category, categoryTestList]) => (
          <TabsContent key={category} value={category} className="space-y-4">
            <div className="grid gap-4">
              {categoryTestList.map((test, index) => (
                <Card key={test.endpoint}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{test.name}</CardTitle>
                        <CardDescription>{test.description}</CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(test.status)}
                        {getStatusIcon(test.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">{test.endpoint}</code>
                    {test.responseTime && (
                      <span className="ml-4 text-sm text-gray-600">{test.responseTime}ms</span>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}