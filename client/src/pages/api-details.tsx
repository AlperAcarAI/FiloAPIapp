import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ApiDetails() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="px-6 py-8">
        <div className="flex items-center mb-8">
          <Link to="/">
            <Button variant="outline" size="sm" className="mr-4">
              <ArrowLeft size={16} className="mr-2" />
              Geri Dön
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold text-slate-800">
            API Yönetimi Kaldırıldı
          </h1>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-slate-500 mb-4">
              API yönetim arayüzü kaldırıldı. Test sayfasını kullanın.
            </p>
            <Link to="/api-test">
              <Button>API Test Sayfasına Git</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}