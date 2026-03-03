import { Users, MapPin, Building, Vote } from 'lucide-react';
import type { Voter } from '@/types/voter';

interface StatsCardsProps {
  voters: Voter[];
}

const StatsCards = ({ voters }: StatsCardsProps) => {
  const communes = new Set(voters.map((v) => v.commune)).size;
  const circons = new Set(voters.map((v) => v.circonscription)).size;
  const bvs = new Set(voters.map((v) => v.bvName)).size;

  const stats = [
    { label: 'Électeurs', value: voters.length, icon: Users, color: 'text-primary' },
    { label: 'Communes', value: communes, icon: MapPin, color: 'text-accent' },
    { label: 'Circonscriptions', value: circons, icon: Building, color: 'text-warning' },
    { label: 'Bureaux de vote', value: bvs, icon: Vote, color: 'text-info' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="stat-card">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-muted ${s.color}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
