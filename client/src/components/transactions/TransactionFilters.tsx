import type { TxnType } from '../../types';
import { useCategories } from '../../api/hooks';
import { Field, Input, Select } from '../ui/Input';
import { Search, X } from 'lucide-react';
import { Button } from '../ui/Button';

export interface Filters {
  q: string;
  type: TxnType | '';
  categoryId: number | '';
  dateFrom: string;
  dateTo: string;
  min: string;
  max: string;
}

export const EMPTY_FILTERS: Filters = {
  q: '',
  type: '',
  categoryId: '',
  dateFrom: '',
  dateTo: '',
  min: '',
  max: '',
};

interface Props {
  filters: Filters;
  onChange: (next: Filters) => void;
  onReset: () => void;
}

export function TransactionFilters({ filters, onChange, onReset }: Props) {
  const cats = useCategories();
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });
  const hasAny =
    filters.q || filters.type || filters.categoryId || filters.dateFrom || filters.dateTo || filters.min || filters.max;

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
      <div className="md:col-span-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            value={filters.q}
            onChange={(e) => set({ q: e.target.value })}
            placeholder="Açıklama veya not içinde ara…"
            className="pl-9"
          />
        </div>
      </div>
      <div className="md:col-span-2">
        <Select value={filters.type} onChange={(e) => set({ type: e.target.value as TxnType | '' })}>
          <option value="">Tüm tipler</option>
          <option value="income">Gelir</option>
          <option value="expense">Gider</option>
        </Select>
      </div>
      <div className="md:col-span-3">
        <Select
          value={filters.categoryId}
          onChange={(e) => set({ categoryId: e.target.value ? Number(e.target.value) : '' })}
        >
          <option value="">Tüm kategoriler</option>
          {cats.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="md:col-span-3 flex gap-2">
        <Input type="date" value={filters.dateFrom} onChange={(e) => set({ dateFrom: e.target.value })} />
        <Input type="date" value={filters.dateTo} onChange={(e) => set({ dateTo: e.target.value })} />
      </div>
      <div className="md:col-span-5 grid grid-cols-2 gap-2">
        <Input
          type="number"
          inputMode="decimal"
          placeholder="Min ₺"
          value={filters.min}
          onChange={(e) => set({ min: e.target.value })}
        />
        <Input
          type="number"
          inputMode="decimal"
          placeholder="Max ₺"
          value={filters.max}
          onChange={(e) => set({ max: e.target.value })}
        />
      </div>
      <div className="md:col-span-7 flex items-center justify-end gap-2">
        {hasAny && (
          <Button variant="ghost" onClick={onReset} leftIcon={<X className="h-3.5 w-3.5" />}>
            Temizle
          </Button>
        )}
      </div>
    </div>
  );
}
