import { Button } from "@/components/ui/button";
import { Code, Plus, Download } from "lucide-react";

interface HeaderProps {
  onNewApi: () => void;
  onExport: () => void;
}

export function Header({ onNewApi, onExport }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Code className="text-white" size={16} />
              </div>
              <h1 className="text-xl font-semibold text-slate-800">
                API Yönetim Sistemi
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button onClick={onNewApi} className="bg-blue-500 hover:bg-blue-600">
              <Plus size={16} className="mr-2" />
              Yeni API
            </Button>
            <Button
              onClick={onExport}
              variant="outline"
              className="bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              <Download size={16} className="mr-2" />
              Dışa Aktar
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
