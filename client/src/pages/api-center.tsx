import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { publicApi, backendApi, authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Code, Play, Database, Users, MapPin, Key, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ApiCenter() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEndpoint, setSelectedEndpoint] = useState('');
  const [testResponse, setTestResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Get all available endpoints
  const { data: endpoints = [] } = useQuery({
    queryKey: ['/api/endpoints'],
    queryFn: () => publicApi.getEndpoints()
  });

  // Get cities data for testing
  const { data: citiesData } = useQuery({
    queryKey: ['/api/getCities'],
    queryFn: () => publicApi.getCities({ limit: 10 })
  });

  // Get Swagger documentation
  const { data: swaggerDocs } = useQuery({
    queryKey: ['/api/docs'],
    queryFn: () => publicApi.getSwaggerDocs()
  });

  const handleTestEndpoint = async (endpoint: string, method: string) => {
    setIsLoading(true);
    try {
      let response;
      
      switch (endpoint) {
        case '/api/getCities':
          response = await publicApi.getCities({ limit: 5 });
          break;
        case '/api/docs':
          response = await publicApi.getSwaggerDocs();
          break;
        case '/api/endpoints':
          response = await publicApi.getEndpoints();
          break;
        default:
          // For other endpoints, make a generic fetch request
          const fetchResponse = await fetch(endpoint);
          response = await fetchResponse.json();
      }
      
      setTestResponse(response);
      toast({
        title: "Test Successful",
        description: `${method} ${endpoint} executed successfully`
      });
    } catch (error) {
      setTestResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
      toast({
        title: "Test Failed",
        description: `Error testing ${endpoint}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEndpoints = endpoints.filter(endpoint =>
    endpoint.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
    endpoint.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-blue-100 text-blue-800';
      case 'POST': return 'bg-green-100 text-green-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Center</h1>
          <p className="text-gray-600 mt-2">Explore and test FiloApi endpoints</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open('/api/docs', '_blank')}>
            <Code className="w-4 h-4 mr-2" />
            Swagger Docs
          </Button>
        </div>
      </div>

      <Tabs defaultValue="endpoints" className="space-y-4">
        <TabsList>
          <TabsTrigger value="endpoints">
            <Database className="w-4 h-4 mr-2" />
            Endpoints
          </TabsTrigger>
          <TabsTrigger value="test">
            <Play className="w-4 h-4 mr-2" />
            API Tester
          </TabsTrigger>
          <TabsTrigger value="examples">
            <Code className="w-4 h-4 mr-2" />
            Examples
          </TabsTrigger>
        </TabsList>

        <TabsContent value="endpoints" className="space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4" />
            <Input
              placeholder="Search endpoints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="grid gap-4">
            {filteredEndpoints.map((endpoint) => (
              <Card key={endpoint.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge className={getMethodColor(endpoint.method)}>
                        {endpoint.method}
                      </Badge>
                      <code className="text-sm font-mono">{endpoint.path}</code>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(endpoint.status)}>
                        {endpoint.status}
                      </Badge>
                      <Button 
                        size="sm" 
                        onClick={() => handleTestEndpoint(endpoint.path, endpoint.method)}
                        disabled={isLoading || endpoint.status !== 'active'}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Test
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{endpoint.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{endpoint.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Tester</CardTitle>
              <CardDescription>Test API endpoints with custom parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Select Endpoint</Label>
                  <Select value={selectedEndpoint} onValueChange={setSelectedEndpoint}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an endpoint" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="/api/getCities">GET /api/getCities</SelectItem>
                      <SelectItem value="/api/docs">GET /api/docs</SelectItem>
                      <SelectItem value="/api/endpoints">GET /api/endpoints</SelectItem>
                      <SelectItem value="/api/test-auth">GET /api/test-auth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Authentication</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select auth method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Public)</SelectItem>
                      <SelectItem value="jwt">JWT Token</SelectItem>
                      <SelectItem value="apikey">API Key</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={() => selectedEndpoint && handleTestEndpoint(selectedEndpoint, 'GET')}
                disabled={!selectedEndpoint || isLoading}
                className="w-full"
              >
                {isLoading ? 'Testing...' : 'Test Endpoint'}
              </Button>

              {testResponse && (
                <div className="space-y-2">
                  <Label>Response</Label>
                  <Textarea
                    value={JSON.stringify(testResponse, null, 2)}
                    readOnly
                    className="h-48 font-mono text-sm"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Cities API Example
                </CardTitle>
                <CardDescription>Get Turkish cities with filtering and pagination</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>JavaScript/Fetch</Label>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`fetch('/api/getCities?search=istanbul&limit=10')
  .then(response => response.json())
  .then(data => console.log(data));`}
                    </pre>
                  </div>
                  <div>
                    <Label>Sample Response</Label>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{JSON.stringify(citiesData, null, 2)}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Authentication Example
                </CardTitle>
                <CardDescription>Login and get JWT token</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Login Request</Label>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
})
.then(response => response.json())
.then(data => {
  // Store the token
  localStorage.setItem('token', data.data.accessToken);
});`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Backend API Example
                </CardTitle>
                <CardDescription>Access hierarchical personnel data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Personnel Request</Label>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`fetch('/api/backend/personnel?page=1&limit=20', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
})
.then(response => response.json())
.then(data => console.log(data));`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}