import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

const SearchBar = ({ value, onChange }: SearchBarProps) => (
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    <Input
      placeholder="Rechercher par CIN, nom, prénom ou adresse..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="pl-10 max-w-md"
    />
  </div>
);

export default SearchBar;
