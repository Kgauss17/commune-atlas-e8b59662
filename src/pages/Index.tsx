import { useState, useMemo } from 'react';
import { FileText, BarChart3, PieChart, Copy, Download, Map, LayoutDashboard, GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ImportButton from '@/components/ImportButton';
import SearchBar from '@/components/SearchBar';
import Filters from '@/components/Filters';
import VoterTable from '@/components/VoterTable';
import MatrixView from '@/components/MatrixView';
import Dashboard from '@/components/Dashboard';
import ThemeToggle from '@/components/ThemeToggle';
import { generateVoterPDF, generateMatrixPDF } from '@/lib/pdfGenerator';
import { exportVotersToExcel } from '@/lib/excelExporter';
import ChartsView from '@/components/ChartsView';
import DuplicatesView from '@/components/DuplicatesView';
import CompareView from '@/components/CompareView';
import MapView from '@/components/MapView';
import type { Voter } from '@/types/voter';

const Index = () => {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [search, setSearch] = useState('');
  const [commune, setCommune] = useState('__all__');
  const [circons, setCircons] = useState('__all__');

  const communes = useMemo(() => [...new Set(voters.map((v) => v.commune))].sort(), [voters]);
  const circonscriptions = useMemo(() => [...new Set(voters.map((v) => v.circonscription))].sort(), [voters]);

  const filtered = useMemo(() => {
    return voters.filter((v) => {
      if (search) {
        const q = search.toLowerCase();
        const match =
          v.cin.toLowerCase().includes(q) ||
          v.firstName.toLowerCase().includes(q) ||
          v.lastName.toLowerCase().includes(q) ||
          v.address.toLowerCase().includes(q) ||
          v.bvAddress.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (commune !== '__all__' && v.commune !== commune) return false;
      if (circons !== '__all__' && v.circonscription !== circons) return false;
      return true;
    });
  }, [voters, search, commune, circons]);

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
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <ImportButton onImport={setVoters} />
          </div>
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
            <Tabs defaultValue="dashboard">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                <TabsList className="flex-wrap">
                  <TabsTrigger value="dashboard" className="gap-1.5">
                    <LayoutDashboard className="h-4 w-4" /> Tableau de bord
                  </TabsTrigger>
                  <TabsTrigger value="list" className="gap-1.5">
                    <FileText className="h-4 w-4" /> Liste
                  </TabsTrigger>
                  <TabsTrigger value="matrix" className="gap-1.5">
                    <BarChart3 className="h-4 w-4" /> Matrice
                  </TabsTrigger>
                  <TabsTrigger value="charts" className="gap-1.5">
                    <PieChart className="h-4 w-4" /> Graphiques
                  </TabsTrigger>
                  <TabsTrigger value="map" className="gap-1.5">
                    <Map className="h-4 w-4" /> Carte
                  </TabsTrigger>
                  <TabsTrigger value="duplicates" className="gap-1.5">
                    <Copy className="h-4 w-4" /> Doublons
                  </TabsTrigger>
                  <TabsTrigger value="compare" className="gap-1.5">
                    <GitCompare className="h-4 w-4" /> Comparer
                  </TabsTrigger>
                </TabsList>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => exportVotersToExcel(filtered)}
                  >
                    <Download className="h-3.5 w-3.5" /> Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => { generateVoterPDF(filtered, 'Liste des Electeurs'); }}
                  >
                    <FileText className="h-3.5 w-3.5" /> PDF Liste
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => generateMatrixPDF(filtered)}
                  >
                    <BarChart3 className="h-3.5 w-3.5" /> PDF Matrice
                  </Button>
                </div>
              </div>

              {/* Search & Filters - shown for relevant tabs */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between mb-4">
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

              <TabsContent value="dashboard" className="mt-0">
                <Dashboard voters={filtered} allVoters={voters} />
              </TabsContent>
              <TabsContent value="list" className="mt-0">
                <VoterTable voters={filtered} />
              </TabsContent>
              <TabsContent value="matrix" className="mt-0">
                <MatrixView voters={filtered} />
              </TabsContent>
              <TabsContent value="charts" className="mt-0">
                <ChartsView voters={filtered} />
              </TabsContent>
              <TabsContent value="map" className="mt-0">
                <MapView voters={filtered} />
              </TabsContent>
              <TabsContent value="duplicates" className="mt-0">
                <DuplicatesView voters={filtered} />
              </TabsContent>
              <TabsContent value="compare" className="mt-0">
                <CompareView currentVoters={voters} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
