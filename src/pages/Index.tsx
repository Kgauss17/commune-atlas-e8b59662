import { useState, useMemo, useCallback } from 'react';
import { FileText, BarChart3, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '@/components/AppSidebar';
import ImportButton from '@/components/ImportButton';
import ImportHistory from '@/components/ImportHistory';
import SearchBar from '@/components/SearchBar';
import Filters from '@/components/Filters';
import VoterTable from '@/components/VoterTable';
import MatrixView from '@/components/MatrixView';
import Dashboard from '@/components/Dashboard';
import { generateVoterPDF, generateMatrixPDF } from '@/lib/pdfGenerator';
import { exportVotersToExcel } from '@/lib/excelExporter';
import { loadVoters, clearVoters, clearImportHistory } from '@/lib/storage';
import ChartsView from '@/components/ChartsView';
import DuplicatesView from '@/components/DuplicatesView';
import CompareView from '@/components/CompareView';
import MapView from '@/components/MapView';
import type { Voter } from '@/types/voter';
import { toast } from 'sonner';

const Index = () => {
  const [voters, setVoters] = useState<Voter[]>(() => loadVoters());
  const [search, setSearch] = useState('');
  const [commune, setCommune] = useState('__all__');
  const [circons, setCircons] = useState('__all__');
  const [activeView, setActiveView] = useState('dashboard');

  const communes = useMemo(() => [...new Set(voters.map((v) => v.commune))].sort(), [voters]);
  const circonscriptions = useMemo(() => [...new Set(voters.map((v) => v.circonscription))].sort(), [voters]);

  const filtered = useMemo(() => {
    return voters.filter((v) => {
      if (search) {
        const q = search.toLowerCase();
        const match =
          String(v.cin ?? '').toLowerCase().includes(q) ||
          String(v.firstName ?? '').toLowerCase().includes(q) ||
          String(v.lastName ?? '').toLowerCase().includes(q) ||
          String(v.address ?? '').toLowerCase().includes(q) ||
          String(v.bvAddress ?? '').toLowerCase().includes(q);
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

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard voters={filtered} allVoters={voters} />;
      case 'list':
        return <VoterTable voters={filtered} />;
      case 'matrix':
        return <MatrixView voters={filtered} />;
      case 'charts':
        return <ChartsView voters={filtered} />;
      case 'map':
        return <MapView voters={filtered} />;
      case 'duplicates':
        return <DuplicatesView voters={filtered} />;
      case 'compare':
        return <CompareView currentVoters={voters} />;
      case 'history':
        return <ImportHistory />;
      default:
        return <Dashboard voters={filtered} allVoters={voters} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar
          activeView={activeView}
          onViewChange={setActiveView}
          voterCount={voters.length}
          hasData={voters.length > 0}
        />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="border-b bg-card sticky top-0 z-10">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <div>
                  <h1 className="text-lg font-bold text-foreground">Gestion Électorale</h1>
                  <p className="text-xs text-muted-foreground">Système de gestion des listes électorales</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ImportButton onImport={setVoters} />
                {voters.length > 0 && (
                  <>
                    <Button
                      size="sm"
                      className="gap-1.5 bg-destructive text-foreground hover:bg-destructive/90 font-semibold"
                      onClick={() => { clearVoters(); clearImportHistory(); setVoters([]); toast.success('Base vidée'); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Vider la base
                    </Button>
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportVotersToExcel(filtered)}>
                      <Download className="h-3.5 w-3.5" /> Excel
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => generateVoterPDF(filtered, 'Liste des Electeurs')}>
                      <FileText className="h-3.5 w-3.5" /> PDF
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => generateMatrixPDF(filtered)}>
                      <BarChart3 className="h-3.5 w-3.5" /> Matrice
                    </Button>
                  </>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 space-y-4 overflow-auto">
            {voters.length === 0 ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <div className="p-4 rounded-full bg-muted mb-4">
                    <FileText className="h-10 w-10" />
                  </div>
                  <p className="text-lg font-medium">Aucune donnée importée</p>
                  <p className="text-sm">Cliquez sur "Importer" pour charger un fichier Excel</p>
                </div>
                <ImportHistory />
              </div>
            ) : (
              <>
                {/* Search & Filters */}
                {activeView !== 'compare' && (
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
                )}

                {renderView()}
              </>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
