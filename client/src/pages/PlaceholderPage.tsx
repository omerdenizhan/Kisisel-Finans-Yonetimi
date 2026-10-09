import { Card, CardHeader } from '../components/ui/Card';
import { Topbar } from '../components/layout/Topbar';
import { Construction } from 'lucide-react';

interface Props {
  title: string;
  subtitle?: string;
  milestone: string;
}

export function PlaceholderPage({ title, subtitle, milestone }: Props) {
  return (
    <>
      <Topbar title={title} subtitle={subtitle} />
      <Card padding="lg">
        <CardHeader
          title={`${title} — Yapım Aşamasında`}
          subtitle={`Bu sayfa ${milestone} aşamasında tamamlanacak.`}
          right={<Construction className="h-4 w-4 text-amber-500" />}
        />
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Plan ve şema hazır. İlgili milestone'da CRUD, grafikler ve dışa aktarma işlevleri
          eklenecek.
        </p>
      </Card>
    </>
  );
}
