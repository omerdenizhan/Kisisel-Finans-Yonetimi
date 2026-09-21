import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Sparkles, Mail, Lock, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Lütfen e-posta adresinizi ve parolanızı girin.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Giriş yapılamadı. E-posta veya parolanızı kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-4 font-sans text-slate-100 antialiased selection:bg-brand-500 selection:text-white">
      {/* Arka plan dekoratif gradyan ışık efektleri */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-brand-600/20 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 -z-10 h-[450px] w-[450px] rounded-full bg-indigo-600/20 blur-[140px]" />

      <div className="w-full max-w-md">
        {/* Logo & Başlık Alanı */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-violet-500 shadow-glow ring-1 ring-white/20">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Kişisel Finans Yönetimi
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Hesabınıza erişmek için lütfen giriş yapın
          </p>
        </div>

        {/* Giriş Kartı */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm text-rose-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* E-posta Alanı */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                E-posta Adresi
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@alanadi.com"
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>

            {/* Parola Alanı */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Parola
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 py-2.5 pl-10 pr-11 text-sm text-white placeholder-slate-500 transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-slate-200 transition"
                  aria-label={showPassword ? 'Parolayı gizle' : 'Parolayı göster'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Giriş Butonu */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                className="w-full justify-center shadow-lg shadow-brand-600/30"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Giriş Yapılıyor…</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    <span>Güvenli Giriş</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Alt Bilgi */}
        <p className="mt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Kişisel Finans Yönetimi v1.0.8 · Geliştirici: Ömer Denizhan
        </p>
      </div>
    </div>
  );
}
export default LoginPage;
