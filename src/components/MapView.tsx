import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { Voter } from '@/types/voter';

interface MapViewProps {
  voters: Voter[];
}

// Morocco regions with approximate SVG positions (simplified map representation)
const REGIONS: { name: string; x: number; y: number; w: number; h: number }[] = [
  { name: 'Tanger-Tétouan-Al Hoceïma', x: 120, y: 20, w: 80, h: 50 },
  { name: "L'Oriental", x: 200, y: 40, w: 90, h: 60 },
  { name: 'Fès-Meknès', x: 150, y: 80, w: 90, h: 60 },
  { name: 'Rabat-Salé-Kénitra', x: 60, y: 100, w: 80, h: 50 },
  { name: 'Béni Mellal-Khénifra', x: 150, y: 150, w: 80, h: 50 },
  { name: 'Casablanca-Settat', x: 60, y: 160, w: 80, h: 40 },
  { name: 'Marrakech-Safi', x: 80, y: 210, w: 100, h: 50 },
  { name: 'Drâa-Tafilalet', x: 190, y: 180, w: 110, h: 80 },
  { name: 'Souss-Massa', x: 70, y: 270, w: 100, h: 50 },
  { name: 'Guelmim-Oued Noun', x: 50, y: 330, w: 100, h: 40 },
  { name: 'Laâyoune-Sakia El Hamra', x: 30, y: 380, w: 120, h: 60 },
  { name: 'Dakhla-Oued Ed-Dahab', x: 20, y: 450, w: 100, h: 60 },
];

function getColorIntensity(value: number, max: number): string {
  if (max === 0) return 'hsl(var(--muted))';
  const ratio = value / max;
  if (ratio > 0.75) return 'hsl(var(--primary))';
  if (ratio > 0.5) return 'hsl(var(--primary) / 0.75)';
  if (ratio > 0.25) return 'hsl(var(--primary) / 0.5)';
  if (ratio > 0) return 'hsl(var(--primary) / 0.25)';
  return 'hsl(var(--muted) / 0.3)';
}

const MapView = ({ voters }: MapViewProps) => {
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);

  const { provinceData, communeByProvince, maxCount } = useMemo(() => {
    const provMap = new Map<string, number>();
    const commByProv = new Map<string, Map<string, number>>();
    
    voters.forEach(v => {
      const prov = v.province || 'Non défini';
      provMap.set(prov, (provMap.get(prov) || 0) + 1);
      
      if (!commByProv.has(prov)) commByProv.set(prov, new Map());
      const commMap = commByProv.get(prov)!;
      commMap.set(v.commune, (commMap.get(v.commune) || 0) + 1);
    });

    const sorted = [...provMap.entries()].sort((a, b) => b[1] - a[1]);
    const maxCount = sorted.length > 0 ? sorted[0][1] : 0;

    return { provinceData: sorted, communeByProvince: commByProv, maxCount };
  }, [voters]);

  if (voters.length === 0) return null;

  const selectedProv = hoveredProvince || (provinceData.length > 0 ? provinceData[0][0] : null);
  const selectedCommunes = selectedProv ? [...(communeByProvince.get(selectedProv) || new Map()).entries()].sort((a, b) => b[1] - a[1]) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Province list with bars */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Répartition par Province</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {provinceData.map(([name, count]) => (
              <div
                key={name}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                  selectedProv === name ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'
                }`}
                onMouseEnter={() => setHoveredProvince(name)}
              >
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium truncate">{name}</span>
                    <span className="font-mono font-semibold text-primary">{count.toLocaleString()}</span>
                  </div>
                  <Progress value={(count / maxCount) * 100} className="h-2" />
                </div>
                <Badge variant="outline" className="text-xs shrink-0">
                  {voters.length > 0 ? ((count / voters.length) * 100).toFixed(1) : 0}%
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detail panel */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold truncate">
            {selectedProv || 'Sélectionnez une province'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedProv && (
            <div className="space-y-3">
              <div className="text-center p-4 rounded-lg bg-primary/5">
                <p className="text-3xl font-bold text-primary">
                  {(communeByProvince.get(selectedProv) ? [...communeByProvince.get(selectedProv)!.values()].reduce((a, b) => a + b, 0) : 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">électeurs</p>
              </div>

              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Communes ({selectedCommunes.length})
              </p>

              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {selectedCommunes.map(([name, count]) => (
                  <div key={name} className="flex items-center justify-between text-sm p-2 rounded bg-muted/30">
                    <span className="truncate">{name}</span>
                    <span className="font-mono font-semibold shrink-0 ml-2">{count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MapView;
