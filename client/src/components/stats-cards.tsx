import { Card, CardContent } from "@/components/ui/card";
import { Code, CheckCircle, PauseCircle, AlertTriangle } from "lucide-react";

interface StatsCardsProps {
  stats: {
    total: number;
    active: number;
    inactive: number;
    error: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Toplam API",
      value: stats.total,
      icon: Code,
      color: "blue",
      bgColor: "bg-blue-100",
      iconColor: "text-blue-500",
      valueColor: "text-slate-900",
    },
    {
      title: "Aktif",
      value: stats.active,
      icon: CheckCircle,
      color: "emerald",
      bgColor: "bg-emerald-100",
      iconColor: "text-emerald-500",
      valueColor: "text-emerald-600",
    },
    {
      title: "Pasif",
      value: stats.inactive,
      icon: PauseCircle,
      color: "amber",
      bgColor: "bg-amber-100",
      iconColor: "text-amber-500",
      valueColor: "text-amber-600",
    },
    {
      title: "Hata",
      value: stats.error,
      icon: AlertTriangle,
      color: "red",
      bgColor: "bg-red-100",
      iconColor: "text-red-500",
      valueColor: "text-red-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <Card key={index} className="shadow-sm border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{card.title}</p>
                <p className={`text-2xl font-bold ${card.valueColor}`}>
                  {card.value}
                </p>
              </div>
              <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                <card.icon className={card.iconColor} size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
