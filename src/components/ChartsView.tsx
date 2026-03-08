import { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Voter } from '@/types/voter';

interface ChartsViewProps {
  voters: Voter[];
}

const COLORS = [
  'hsl(215, 80%, 48%)',
  'hsl(160, 60%, 42%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 72%, 51%)',
  'hsl(270, 60%, 55%)',
  'hsl(190, 70%, 45%)',
  'hsl(330, 65%, 50%)',
  'hsl(95, 55%, 45%)',
  'hsl(25, 85%, 55%)',
  'hsl(250, 50%, 60%)',
];

const ChartsView = ({ voters }: ChartsViewProps) => {
  const communeData = useMemo(() => {
    const map = new Map<string, number>();
    voters.forEach((v) => map.set(v.commune, (map.get(v.commune) || 0) + 1));
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [voters]);

  const circonsData = useMemo(() => {
    const map = new Map<string, number>();
    voters.forEach((v) => map.set(v.circonscription, (map.get(v.circonscription) || 0) + 1));
    return Array.from(map.entries())
      .map(([name, value]) => ({ name: `Circ. ${name}`, rawName: name, value }))
      .sort((a, b) => {
        const numA = parseInt(a.rawName, 10);
        const numB = parseInt(b.rawName, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.rawName.localeCompare(b.rawName);
      });
  }, [voters]);

  const genderData = useMemo(() => {
    let m = 0, f = 0;
    voters.forEach((v) => (v.gender === 'm' ? m++ : f++));
    return [
      { name: 'Hommes', value: m },
      { name: 'Femmes', value: f },
    ];
  }, [voters]);

  if (voters.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pie - Communes */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h3 className="font-semibold text-sm text-foreground">Répartition par Commune</h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={communeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false} fontSize={11}>
              {communeData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Bar - Circonscriptions */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h3 className="font-semibold text-sm text-foreground">Électeurs par Circonscription</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={circonsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 88%)" />
            <XAxis dataKey="name" fontSize={11} tick={{ fill: 'hsl(220, 10%, 45%)' }} />
            <YAxis fontSize={11} tick={{ fill: 'hsl(220, 10%, 45%)' }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" name="Électeurs" radius={[6, 6, 0, 0]}>
              {circonsData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie - Genre */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h3 className="font-semibold text-sm text-foreground">Répartition par Genre</h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false} fontSize={12}>
              <Cell fill="hsl(215, 80%, 48%)" />
              <Cell fill="hsl(160, 60%, 42%)" />
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Bar - Communes */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h3 className="font-semibold text-sm text-foreground">Électeurs par Commune</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={communeData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 88%)" />
            <XAxis type="number" fontSize={11} tick={{ fill: 'hsl(220, 10%, 45%)' }} allowDecimals={false} />
            <YAxis type="category" dataKey="name" fontSize={11} tick={{ fill: 'hsl(220, 10%, 45%)' }} width={90} />
            <Tooltip />
            <Bar dataKey="value" name="Électeurs" radius={[0, 6, 6, 0]}>
              {communeData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartsView;
