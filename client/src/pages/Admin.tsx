import { useState, type FormEvent, useEffect } from 'react';
import { Topbar } from '../components/layout/Topbar';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Field, Input } from '../components/ui/Input';
import { toast } from '../components/ui/Toast';
import { useAuthStore } from '../stores/authStore';
import {
  ShieldCheck,
  User,
  Mail,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  Database,
  Calendar,
} from 'lucide-react';

export function AdminPage() {
  const { user, updateProfile, changePassword } = useAuthStore();

  // Profil Formu Durumu
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileLoading, setProfileLoading] = useState(false);

  // Parola Formu Durumu
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  // Profil Bilgilerini Güncelleme
  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error('İsim ve e-posta alanları boş bırakılamaz');
      return;
    }

    try {
      setProfileLoading(true);
      await updateProfile(name.trim(), email.trim());
      toast.success('Kullanıcı bilgileri başarıyla güncellendi');
    } catch (err: any) {
      toast.error(err?.message || 'Kullanıcı bilgileri güncellenemedi');
    } finally {
      setProfileLoading(false);
    }
  };

  // Parola Değiştirme
  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Lütfen mevcut parolanızı girin');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Yeni parola en az 6 karakter olmalıdır');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Yeni parolalar eşleşmiyor');
      return;
    }

    try {
      setPasswordLoading(true);
      await changePassword(currentPassword, newPassword);
      toast.success('Parolanız başarıyla değiştirildi');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err?.message || 'Parola değiştirilemedi');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <>
      <Topbar
        title="Kullanıcı Yönetimi"
        subtitle="Hesap bilgileri, güvenlik ve yetkilendirme ayarları"
      />

      <div className="space-y-6">
        {/* Üst Bilgi Kartı */}
        <div className="glass-strong flex flex-col gap-4 rounded-2xl p-5 shadow-glass sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-glow">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {user?.name || 'Yönetici Hesabı'}
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                  Aktif Yönetici
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {user?.email} · Yönetici Yetkileri Aktif
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Calendar className="h-4 w-4 text-brand-500" />
            <span>Oturum Tarihi: {new Date().toLocaleDateString('tr-TR')}</span>
          </div>
        </div>

        {/* İki Kolonlu Form Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Kullanıcı Bilgileri Formu */}
          <Card padding="lg">
            <CardHeader
              title="Kullanıcı Bilgileri"
              subtitle="Yönetici adı ve giriş e-posta adresini güncelleyin"
            />

            <form onSubmit={handleProfileSubmit} className="mt-4 space-y-4">
              <Field label="Ad ve Soyad">
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Örn: Adı Soyadı"
                    className="pl-10"
                    required
                  />
                </div>
              </Field>

              <Field label="E-posta Adresi">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Örn: admin@admin.com"
                    className="pl-10"
                    required
                  />
                </div>
              </Field>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={profileLoading}
                  leftIcon={<Save className="h-4 w-4" />}
                >
                  {profileLoading ? 'Kaydediliyor…' : 'Bilgileri Güncelle'}
                </Button>
              </div>
            </form>
          </Card>

          {/* Parola Değiştirme Formu */}
          <Card padding="lg">
            <CardHeader
              title="Parola Değiştir"
              subtitle="Hesap güvenliğiniz için parolanızı periyodik olarak güncelleyin"
            />

            <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
              <Field label="Mevcut Parola">
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label={showCurrent ? 'Gizle' : 'Göster'}
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              <Field label="Yeni Parola">
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="En az 6 karakter"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label={showNew ? 'Gizle' : 'Göster'}
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              <Field label="Yeni Parola (Tekrar)">
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Yeni parolayı tekrar girin"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label={showConfirm ? 'Gizle' : 'Göster'}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={passwordLoading}
                  leftIcon={<KeyRound className="h-4 w-4" />}
                >
                  {passwordLoading ? 'Parola Güncelleniyor…' : 'Parolayı Değiştir'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Veritabanı & Güvenlik Durumu */}
        <Card padding="lg">
          <CardHeader
            title="Sistem & Veritabanı Güvenliği"
            subtitle="Yerel SQLite veritabanı ve aktif oturum mekanizması"
          />
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="glass flex items-start gap-3 rounded-xl p-4">
              <Database className="h-5 w-5 text-brand-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Veritabanı</p>
                <p className="text-xs text-slate-500">server/data/finance.db</p>
                <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">Şifrelenmiş Parola (PBKDF2/Salt)</p>
              </div>
            </div>
            <div className="glass flex items-start gap-3 rounded-xl p-4">
              <ShieldCheck className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Yetkilendirme</p>
                <p className="text-xs text-slate-500">Korumalı Rotalar & Token</p>
                <p className="mt-1 text-[11px] text-brand-600 dark:text-brand-400">API Bearer Session Token</p>
              </div>
            </div>
            <div className="glass flex items-start gap-3 rounded-xl p-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Oturum Süresi</p>
                <p className="text-xs text-slate-500">30 Gün Otomatik Oturum</p>
                <p className="mt-1 text-[11px] text-slate-400">Tekil Kullanıcı Güvenliği</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

export default AdminPage;
