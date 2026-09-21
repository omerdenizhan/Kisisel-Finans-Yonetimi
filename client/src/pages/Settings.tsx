import { useState } from 'react';
import { Topbar } from '../components/layout/Topbar';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Field, Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Plus, Pencil, Archive, Trash2 } from 'lucide-react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../api/hooks';
import type { Category, TxnType } from '../types';
import { toast } from '../components/ui/Toast';

export function SettingsPage(): JSX.Element {
  const [typeFilter, setTypeFilter] = useState<TxnType | 'all'>('all');
  const cats = useCategories(typeFilter === 'all' ? undefined : typeFilter);
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const del = useDeleteCategory();

  const [openNew, setOpenNew] = useState(false);
  const [edit, setEdit] = useState<Category | undefined>();

  const [name, setName] = useState('');
  const [type, setType] = useState<TxnType>('expense');
  const [color, setColor] = useState('#6366f1');

  const startNew = () => {
    setEdit(undefined);
    setName('');
    setType('expense');
    setColor('#6366f1');
    setOpenNew(true);
  };

  const startEdit = (c: Category) => {
    setEdit(c);
    setName(c.name);
    setType(c.type);
    setColor(c.color ?? '#6366f1');
    setOpenNew(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('İsim gerekli');
      return;
    }
    try {
      if (edit) {
        await update.mutateAsync({ id: edit.id, name: name.trim(), type, color });
        toast.success('Kategori güncellendi');
      } else {
        await create.mutateAsync({ name: name.trim(), type, color });
        toast.success('Kategori eklendi');
      }
      setOpenNew(false);
    } catch (e: any) {
      toast.error(e?.message ?? 'Hata');
    }
  };

  const onDelete = async (c: Category) => {
    if (!confirm(`"${c.name}" kategorisi silinsin mi? (Kullanılıyorsa arşivlenir)`)) return;
    try {
      const r = await del.mutateAsync(c.id);
      if ((r as any).archived) toast.info('Kategori arşivlendi (kullanımda)');
      else toast.success('Kategori silindi');
    } catch (e: any) {
      toast.error(e?.message ?? 'Hata');
    }
  };

  return (
    <>
      <Topbar
        title="Ayarlar"
        subtitle="Kategoriler ve veritabanı"
        right={
          <Button onClick={startNew} leftIcon={<Plus className="h-4 w-4" />}>
            Yeni Kategori
          </Button>
        }
      />

      <Card padding="md">
        <CardHeader
          title="Kategoriler"
          subtitle={`${cats.data?.length ?? 0} kayıt`}
          right={
            <div className="flex gap-2">
              <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)}>
                <option value="all">Tümü</option>
                <option value="income">Gelir</option>
                <option value="expense">Gider</option>
              </Select>
            </div>
          }
        />

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {cats.data?.map((c) => (
            <div
              key={c.id}
              className="glass flex items-center justify-between gap-2 rounded-xl p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="h-7 w-7 shrink-0 rounded-lg"
                  style={{ background: c.color ?? '#94a3b8' }}
                />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {c.name}
                  </div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-500">
                    {c.type === 'income' ? 'Gelir' : 'Gider'}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => startEdit(c)}
                  aria-label="Düzenle"
                  className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 focus-ring"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onDelete(c)}
                  aria-label="Sil/Arşivle"
                  className="grid h-8 w-8 place-items-center rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 focus-ring"
                >
                  {c.is_archived ? <Archive className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal
        open={openNew}
        onClose={() => setOpenNew(false)}
        title={edit ? 'Kategoriyi Düzenle' : 'Yeni Kategori'}
        description={edit ? 'Mevcut kategoriyi güncelleyin' : 'Gelir veya gider kategorisi ekleyin'}
      >
        <form onSubmit={submit} className="space-y-4">
          <Field label="Ad">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="örn. Kahve" required />
          </Field>
          <Field label="Tür">
            <Select value={type} onChange={(e) => setType(e.target.value as TxnType)}>
              <option value="expense">Gider</option>
              <option value="income">Gelir</option>
            </Select>
          </Field>
          <Field label="Renk">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-12 cursor-pointer rounded-lg border border-slate-200/60 dark:border-slate-700/50"
              />
              <Input value={color} onChange={(e) => setColor(e.target.value)} className="flex-1" />
            </div>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpenNew(false)}>
              İptal
            </Button>
            <Button type="submit">{edit ? 'Güncelle' : 'Ekle'}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
