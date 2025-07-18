import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Trash2 } from "lucide-react";
import { Api } from "@shared/schema";
import { Link } from "wouter";

interface ApiCardProps {
  api: Api;
  onEdit: (api: Api) => void;
  onDelete: (id: string) => void;
}

export function ApiCard({ api, onEdit, onDelete }: ApiCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "aktif":
        return "bg-emerald-100 text-emerald-800";
      case "pasif":
        return "bg-amber-100 text-amber-800";
      case "hata":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "aktif":
        return "Aktif";
      case "pasif":
        return "Pasif";
      case "hata":
        return "Hata";
      default:
        return status;
    }
  };

  const formatLastRun = (date: Date | null) => {
    if (!date) return "Henüz çalışmadı";
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Az önce";
    if (minutes < 60) return `${minutes} dakika önce`;
    if (hours < 24) return `${hours} saat önce`;
    return `${days} gün önce`;
  };

  return (
    <Card className="bg-slate-50 border-slate-200 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-slate-800 mb-2">{api.ad}</h3>
            <p className="text-sm text-slate-600 mb-3 line-clamp-2">
              {api.aciklama}
            </p>
          </div>
          <Badge className={`${getStatusColor(api.durum)} ml-3`}>
            <span className="w-2 h-2 bg-current rounded-full mr-1"></span>
            {getStatusText(api.durum)}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
          <span>Son çalışma: {formatLastRun(api.son_calistigi)}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link href={`/api/${api.api_id}`}>
              <Button variant="ghost" size="sm">
                <Eye size={16} className="text-blue-600" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(api)}
            >
              <Edit size={16} className="text-slate-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(api.api_id)}
            >
              <Trash2 size={16} className="text-red-600" />
            </Button>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="px-3 py-1 bg-blue-100 text-blue-700 text-xs hover:bg-blue-200"
          >
            Test Et
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
