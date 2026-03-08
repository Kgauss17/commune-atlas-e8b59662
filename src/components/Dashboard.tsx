import { useMemo } from 'react';
import { Users, UserCheck, UserX, AlertTriangle, MapPin, Building, Vote, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { Voter } from '@/types/voter';

interface DashboardProps {
  voters: Voter[];
  allVoters: Voter[];
}

const Dashboard = ({ voters, allVoters }: DashboardProps) => {
  const stats = useMemo(() => {
    const total = voters.length;
    let males = 0, females = 0;
    const communeMap = new Map<string, number>();
    const circonsMap = new Map<string, number>();
    const bvSet = new Set<string>();
    const provinceSet = new Set<string>();

    voters.forEach((v) => {
      if (v.gender === 'm') males++; else females++;
      communeMap.set(v.commune, (communeMap.get(v.commune) || 0) + 1);
      circonsMap.set(v.circonscription, (circonsMap.get(v.circonscription) || 0) + 1);
      bvSet.add(v.bvName);
      if (v.province) provinceSet.add(v.province);
    });

    // Duplicates
    const cinMap = new Map<string, number>();
    allVoters.forEach((v) => {
      if (v.cin) cinMap.set(v.cin.trim(), (cinMap.get(v.cin.trim()) || 0) + 1);
    });
    const duplicateCount = [...cinMap.values()].filter(c => c > 1).length;

    // Top communes
    const topCommunes = [...communeMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Top circonscriptions
    const topCircons = [...circonsMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      total, males, females,
      malePercent: total > 0 ? Math.round((males / total) * 100) : 0,
      femalePercent: total > 0 ? Math.round((females / total) * 100) : 0,
      communes: communeMap.size,
      circons: circonsMap.size,
      bvs: bvSet.size,
      provinces: provinceSet.size,
      duplicateCount,
      topCommunes,
      topCircons,
    };
  }, [voters, allVoters]);

  const genderData = [
    { name: 'Hommes', value: stats.males },
    { name: 'Femmes', value: stats.females },
  ];

  if (voters.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Électeurs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10 text-info">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.communes}</p>
                <p className="text-sm text-muted-foreground">Communes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10 text-warning">
                <Building className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.circons}</p>
                <p className="text-sm text-muted-foreground">Circonscriptions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10 text-success">
                <Vote className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.bvs}</p>
                <p className="text-sm text-muted-foreground">Bureaux de vote</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second row: Gender + Duplicates Alert */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Gender breakdown */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Répartition par Genre</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <UserCheck className="h-4 w-4 text-info" />
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>Hommes</span>
                  <span className="font-semibold">{stats.males.toLocaleString()} ({stats.malePercent}%)</span>
                </div>
                <Progress value={stats.malePercent} className="h-2" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <UserX className="h-4 w-4 text-accent-foreground" />
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>Femmes</span>
                  <span className="font-semibold">{stats.females.toLocaleString()} ({stats.femalePercent}%)</span>
                </div>
                <Progress value={stats.femalePercent} className="h-2" />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65} fontSize={11}>
                  <Cell fill="hsl(215, 80%, 48%)" />
                  <Cell fill="hsl(160, 60%, 42%)" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Duplicate alert + provinces */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Alertes & Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.duplicateCount > 0 ? (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-destructive">Doublons détectés</p>
                  <p className="text-sm text-muted-foreground">{stats.duplicateCount} CIN en doublon dans les données</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
                <UserCheck className="h-5 w-5 text-success mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-success">Aucun doublon</p>
                  <p className="text-sm text-muted-foreground">Tous les CIN sont uniques</p>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Provinces: {stats.provinces}
              </p>
              <p className="text-sm text-muted-foreground">
                Moyenne: {stats.communes > 0 ? Math.round(stats.total / stats.communes) : 0} électeurs/commune
              </p>
              <p className="text-sm text-muted-foreground">
                Moyenne: {stats.bvs > 0 ? Math.round(stats.total / stats.bvs) : 0} électeurs/BV
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Top communes */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Top 5 Communes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.topCommunes.map(([name, count], i) => (
              <div key={name} className="flex items-center gap-3">
                <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0 text-xs">
                  {i + 1}
                </Badge>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="truncate">{name}</span>
                    <span className="font-mono font-semibold">{count.toLocaleString()}</span>
                  </div>
                  <Progress value={(count / stats.total) * 100} className="h-1.5" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
