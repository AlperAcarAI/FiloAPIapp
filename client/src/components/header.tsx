import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { TestTube } from "lucide-react";

export function Header() {
  return (
    <div className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              API Management Sistemi
            </h1>
            <p className="text-slate-600">
              Güvenli API'leri test edin ve yönetin
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link to="/api-test">
              <Button>
                <TestTube className="h-4 w-4 mr-2" />
                API Test
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}