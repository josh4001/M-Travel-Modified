import { ReactNode } from 'react';
import { Card3D } from './Card3D';

interface Stats3DCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: string;
  accentColor?: 'marigold' | 'teal' | 'coral';
}

export function Stats3DCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  accentColor = 'marigold',
}: Stats3DCardProps) {
  const colorMap = {
    marigold: 'text-marigold bg-marigold/10 border-marigold/30',
    teal: 'text-teal bg-teal/10 border-teal/30',
    coral: 'text-coral bg-coral/10 border-coral/30',
  };

  return (
    <Card3D intensity={10} className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase font-bold tracking-wider text-slate-500">{title}</p>
          <h3 className="mt-2 font-mono text-3xl font-bold tracking-tight text-slate-900">{value}</h3>
          {subtitle && <p className="mt-1 text-xs text-slate-600 font-medium">{subtitle}</p>}
        </div>

        <div className={`rounded-xl border p-3 ${colorMap[accentColor]} shadow-sm`}>
          {icon}
        </div>
      </div>

      {trend && (
        <div className="mt-4 border-t border-slate-200 pt-3 text-xs text-slate-600 font-medium flex items-center justify-between">
          <span>Activity</span>
          <span className="font-mono font-bold text-amber-700">{trend}</span>
        </div>
      )}
    </Card3D>
  );
}
