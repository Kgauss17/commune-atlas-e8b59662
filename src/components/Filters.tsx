import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface FiltersProps {
  communes: string[];
  circonscriptions: string[];
  selectedCommune: string;
  selectedCirconscription: string;
  onCommuneChange: (v: string) => void;
  onCirconscriptionChange: (v: string) => void;
  onReset: () => void;
}

const Filters = ({
  communes, circonscriptions,
  selectedCommune, selectedCirconscription,
  onCommuneChange, onCirconscriptionChange, onReset,
}: FiltersProps) => (
  <div className="flex flex-wrap items-center gap-3">
    <Select value={selectedCommune} onValueChange={onCommuneChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Commune" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">Toutes les communes</SelectItem>
        {communes.map((c) => (
          <SelectItem key={c} value={c}>{c}</SelectItem>
        ))}
      </SelectContent>
    </Select>

    <Select value={selectedCirconscription} onValueChange={onCirconscriptionChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Circonscription" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">Toutes les circ.</SelectItem>
        {circonscriptions.map((c) => (
          <SelectItem key={c} value={c}>{c}</SelectItem>
        ))}
      </SelectContent>
    </Select>

    {(selectedCommune !== '__all__' || selectedCirconscription !== '__all__') && (
      <Button variant="ghost" size="sm" onClick={onReset} className="gap-1 text-muted-foreground">
        <X className="h-3 w-3" /> Réinitialiser
      </Button>
    )}
  </div>
);

export default Filters;
