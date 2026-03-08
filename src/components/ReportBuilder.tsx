import { useState, useMemo } from 'react';
import { FileText, Printer, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import type { Voter } from '@/types/voter';

interface ReportBuilderProps {
  voters: Voter[];
}

const FIELD_OPTIONS: { key: keyof Voter; label: string; labelAr: string }[] = [
  { key: 'orderNumber', label: 'N° Ordre', labelAr: 'رقم الترتيب' },
  { key: 'cin', label: 'CIN', labelAr: 'رقم ب.ت.و' },
  { key: 'lastName', label: 'Nom', labelAr: 'النسب' },
  { key: 'firstName', label: 'Prénom', labelAr: 'الاسم' },
  { key: 'birthDate', label: 'Date de naissance', labelAr: 'تاريخ الازدياد' },
  { key: 'gender', label: 'Sexe', labelAr: 'الجنس' },
  { key: 'address', label: 'Adresse', labelAr: 'العنوان' },
  { key: 'commune', label: 'Commune', labelAr: 'الجماعة' },
  { key: 'circonscription', label: 'Circonscription', labelAr: 'الدائرة الانتخابية' },
  { key: 'province', label: 'Province', labelAr: 'الإقليم' },
  { key: 'bvName', label: 'Bureau de vote', labelAr: 'مكتب التصويت' },
  { key: 'bvAddress', label: 'Adresse BV', labelAr: 'عنوان مكتب التصويت' },
  { key: 'bvLocation', label: 'Lieu BV', labelAr: 'موقع مكتب التصويت' },
];

const PAGE_SIZES = [10, 25, 50, 100];

const ReportBuilder = ({ voters }: ReportBuilderProps) => {
  const [selectedFields, setSelectedFields] = useState<(keyof Voter)[]>([
    'orderNumber', 'cin', 'lastName', 'firstName', 'birthDate', 'commune',
  ]);
  const [titleAr, setTitleAr] = useState('لائحة الناخبين');
  const [electionDate, setElectionDate] = useState<Date>();
  const [commune, setCommune] = useState('__all__');
  const [circons, setCircons] = useState('__all__');
  const [showPreview, setShowPreview] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const communes = useMemo(() => [...new Set(voters.map(v => v.commune))].sort(), [voters]);
  const circonscriptions = useMemo(() => [...new Set(voters.map(v => v.circonscription))].sort(), [voters]);

  const filtered = useMemo(() => {
    return voters.filter(v => {
      if (commune !== '__all__' && v.commune !== commune) return false;
      if (circons !== '__all__' && v.circonscription !== circons) return false;
      return true;
    });
  }, [voters, commune, circons]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleField = (key: keyof Voter) => {
    setSelectedFields(prev =>
      prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
    );
  };

  const getFieldLabel = (key: keyof Voter) => FIELD_OPTIONS.find(f => f.key === key)?.labelAr || key;

  const handlePrint = () => {
    window.print();
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="space-y-4">
      {/* Configuration Panel */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Créer un état
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Titre de l'état (en arabe)</Label>
              <Input
                value={titleAr}
                onChange={e => setTitleAr(e.target.value)}
                dir="rtl"
                className="font-[IBM_Plex_Sans_Arabic] text-right"
                placeholder="عنوان الوثيقة"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Jour J de l'élection</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !electionDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {electionDate ? format(electionDate, 'PPP') : 'Choisir une date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={electionDate} onSelect={setElectionDate} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Commune</Label>
              <Select value={commune} onValueChange={v => { setCommune(v); setCurrentPage(1); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Toutes les communes</SelectItem>
                  {communes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Circonscription</Label>
              <Select value={circons} onValueChange={v => { setCircons(v); setCurrentPage(1); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Toutes les circonscriptions</SelectItem>
                  {circonscriptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Field Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Champs à afficher</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-3 bg-muted/20 rounded-md border">
              {FIELD_OPTIONS.map(field => (
                <label key={field.key} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/30 rounded px-2 py-1.5 transition-colors">
                  <Checkbox
                    checked={selectedFields.includes(field.key)}
                    onCheckedChange={() => toggleField(field.key)}
                  />
                  <span>{field.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setShowPreview(true)} disabled={selectedFields.length === 0} className="gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Aperçu
            </Button>
            {showPreview && (
              <Button variant="outline" onClick={handlePrint} className="gap-1.5">
                <Printer className="h-3.5 w-3.5" /> Imprimer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Preview - AdminLTE v3 style */}
      {showPreview && (
        <div className="print:m-0" id="report-preview">
          {/* AdminLTE Card */}
          <div className="bg-card rounded shadow-sm border overflow-hidden">
            {/* Card Header - AdminLTE style */}
            <div className="bg-primary/10 border-b px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary print:hidden" />
                <span className="font-semibold text-sm">État électoral</span>
              </div>
              <span className="text-xs text-muted-foreground">{filtered.length} enregistrement(s)</span>
            </div>

            {/* Report Header (Arabic) */}
            <div className="p-6 text-center border-b bg-card" dir="rtl">
              <h2 className="text-2xl font-bold font-[IBM_Plex_Sans_Arabic] text-foreground mb-1">{titleAr}</h2>
              {electionDate && (
                <p className="text-sm font-[IBM_Plex_Sans_Arabic] text-muted-foreground">
                  يوم الاقتراع: {format(electionDate, 'yyyy/MM/dd')}
                </p>
              )}
              {commune !== '__all__' && (
                <p className="text-sm font-[IBM_Plex_Sans_Arabic] text-muted-foreground mt-1">
                  الجماعة: {commune}
                </p>
              )}
              {circons !== '__all__' && (
                <p className="text-sm font-[IBM_Plex_Sans_Arabic] text-muted-foreground">
                  الدائرة الانتخابية: {circons}
                </p>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary text-secondary-foreground">
                    <th className="px-3 py-2.5 text-center font-semibold text-xs border-r border-secondary-foreground/20 w-10">#</th>
                    {selectedFields.map(key => (
                      <th key={key} className="px-3 py-2.5 text-right font-semibold text-xs border-r border-secondary-foreground/20 font-[IBM_Plex_Sans_Arabic]" dir="rtl">
                        {getFieldLabel(key)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((voter, idx) => (
                    <tr
                      key={idx}
                      className={cn(
                        "border-b border-border/50 hover:bg-muted/30 transition-colors",
                        idx % 2 === 0 ? "bg-card" : "bg-muted/10"
                      )}
                    >
                      <td className="px-3 py-2 text-center text-xs text-muted-foreground border-r border-border/30">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>
                      {selectedFields.map(key => (
                        <td key={key} className="px-3 py-2 text-right text-xs border-r border-border/30" dir="rtl">
                          {String(voter[key] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {paginatedData.length === 0 && (
                    <tr>
                      <td colSpan={selectedFields.length + 1} className="px-4 py-8 text-center text-muted-foreground text-sm">
                        Aucun enregistrement trouvé
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer - AdminLTE v3 style */}
            <div className="px-4 py-3 border-t bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Afficher</span>
                <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setCurrentPage(1); }}>
                  <SelectTrigger className="h-7 w-16 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZES.map(s => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <span>sur {filtered.length} enregistrements</span>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>

                  {getPageNumbers().map((page, i) =>
                    typeof page === 'string' ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted-foreground">...</span>
                    ) : (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        className="h-7 w-7 p-0 text-xs"
                        onClick={() => goToPage(page)}
                      >
                        {page}
                      </Button>
                    )
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportBuilder;
