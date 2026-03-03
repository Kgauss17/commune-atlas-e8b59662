import { useState, useMemo } from 'react';
import { FileText, BarChart3, PieChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ImportButton from '@/components/ImportButton';
import SearchBar from '@/components/SearchBar';
import Filters from '@/components/Filters';
import VoterTable from '@/components/VoterTable';
import MatrixView from '@/components/MatrixView';
import StatsCards from '@/components/StatsCards';
import { generateVoterPDF, generateMatrixPDF } from '@/lib/pdfGenerator';
import ChartsView from '@/components/ChartsView';
import type { Voter, MatrixRow } from '@/types/voter';

const Index = () => {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [search, setSearch] = useState('');
  const [commune, setCommune] = useState('__all__');
  const [circons, setCircons] = useState('__all__');

  const communes = useMemo(() => [...new Set(voters.map((v) => v.commune))].sort(), [voters]);
  const circonscriptions = useMemo(() => [...new Set(voters.map((v) => v.circonscription))].sort(), [voters]);

  const filtered = useMemo(() => {
    return voters.filter((v) => {
      if (search && !v.cin.toLowerCase().includes(search.toLowerCase())) return false;
      if (commune !== '__all__' && v.commune !== commune) return false;
      if (circons !== '__all__' && v.circonscription !== circons) return false;
      return true;
    });
  }, [voters, search, commune, circons]);

  const matrix = useMemo<MatrixRow[]>(() => {
    const map = new Map<string, number>();
    filtered.forEach((v) => {
      const key = `${v.commune}||${v.circonscription}||${v.bvName}`;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([key, count]) => {
        const [commune, circonscription, bv] = key.split('||');
        return { commune, circonscription, bv, count };
      })
      .sort((a, b) => a.commune.localeCompare(b.commune) || a.circonscription.localeCompare(b.circonscription));
  }, [filtered]);

  const resetFilters = () => {
    setCommune('__all__');
    setCircons('__all__');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Gestion Électorale</h1>
            <p className="text-sm text-muted-foreground">Système de gestion des listes électorales</p>
          </div>
          <ImportButton onImport={setVoters} />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {voters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
            <div className="p-4 rounded-full bg-muted mb-4">
              <FileText className="h-10 w-10" />
            </div>
            <p className="text-lg font-medium">Aucune donnée importée</p>
            <p className="text-sm">Cliquez sur "Importer" pour charger un fichier Excel</p>
          </div>
        ) : (
          <>
            <StatsCards voters={filtered} />

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
              <SearchBar value={search} onChange={setSearch} />
              <Filters
                communes={communes}
                circonscriptions={circonscriptions}
                selectedCommune={commune}
                selectedCirconscription={circons}
                onCommuneChange={setCommune}
                onCirconscriptionChange={setCircons}
                onReset={resetFilters}
              />
            </div>

            <Tabs defaultValue="list">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="list" className="gap-1.5">
                    <FileText className="h-4 w-4" /> Liste
                  </TabsTrigger>
                  <TabsTrigger value="matrix" className="gap-1.5">
                    <BarChart3 className="h-4 w-4" /> Matrice
                  </TabsTrigger>
                  <TabsTrigger value="charts" className="gap-1.5">
                    <PieChart className="h-4 w-4" /> Graphiques
                  </TabsTrigger>
                </TabsList>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => generateVoterPDF(filtered, 'Liste des Electeurs')}
                  >
                    <FileText className="h-3.5 w-3.5" /> PDF Liste
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => generateMatrixPDF(matrix)}
                  >
                    <BarChart3 className="h-3.5 w-3.5" /> PDF Matrice
                  </Button>
                </div>
              </div>

              <TabsContent value="list" className="mt-4">
                <VoterTable voters={filtered} />
              </TabsContent>
              <TabsContent value="matrix" className="mt-4">
                <MatrixView data={matrix} />
              </TabsContent>
              <TabsContent value="charts" className="mt-4">
                <ChartsView voters={filtered} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
