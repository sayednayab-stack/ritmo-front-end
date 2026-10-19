import { Suspense, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, Eye, EyeOff, Plane } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { errorMessage } from '@/lib/api';

function LoginForm() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post('/api/auth/login', { username, password });
      const next = params.get('next');
      navigate(next && next.startsWith('/') && !next.startsWith('//') ? next : '/', { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Invalid credentials. Please try again.'));
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <Input
        label="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoComplete="username"
        autoFocus
        required
        placeholder="Enter your username"
      />
      <div className="relative">
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          placeholder="Enter your password"
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="absolute right-0 bottom-0 h-10 w-10 flex items-center justify-center text-text-tertiary hover:text-text-primary transition-colors"
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && (
        <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-danger-soft border border-danger/20 text-sm text-danger">
          <span className="w-1.5 h-1.5 rounded-full bg-danger mt-1.5 flex-shrink-0" />
          {error}
        </div>
      )}
      <Button type="submit" className="w-full justify-between" loading={loading} size="lg">
        <span>Sign in</span>
        {!loading && <ArrowRight className="h-4 w-4" />}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
      {/* ── Left: brand panel ── */}
      <div
        className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden"
        style={{ background: 'linear-gradient(180deg,#0A3470 0%,#072D62 45%,#04204A 100%)' }}
      >
        {/* Gold glow blobs */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full opacity-[0.08] animate-float-slow"
          style={{ background: 'radial-gradient(circle,#B39661,transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-60 h-60 rounded-full opacity-[0.06] animate-float-slow"
          style={{ background: 'radial-gradient(circle,#ffffff,transparent 70%)', animationDelay: '4s' }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-gold/20 border border-accent-gold/30 flex items-center justify-center">
            <span className="font-serif text-accent-gold text-xl font-medium">R</span>
          </div>
          <div>
            <p className="font-semibold text-white text-base tracking-tight">RITMO</p>
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/40">Fleet Console</p>
          </div>
        </div>

        {/* Headline */}
        <div className="relative z-10">
          <div className="w-12 h-px bg-accent-gold mb-6 opacity-60" />
          <h2 className="font-serif text-5xl font-light tracking-tight text-white leading-tight mb-4">
            Airport transfers,<br />managed precisely.
          </h2>
          <p className="text-white/50 text-sm leading-relaxed max-w-xs">
            Real-time dispatch, channel manager integrations, and full operational visibility in one place.
          </p>
        </div>

        {/* Source systems */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex -space-x-2">
            {['AI', 'IX', 'EY'].map((code) => (
              <div key={code} className="w-8 h-8 rounded-full bg-white/10 border-2 border-[#072D62] flex items-center justify-center">
                <span className="text-[9px] font-bold text-white/70 font-mono">{code}</span>
              </div>
            ))}
          </div>
          <p className="text-white/40 text-xs">All source systems connected</p>
        </div>
      </div>

      {/* ── Right: form panel ── */}
      <div
        className="flex items-center justify-center p-6 bg-ops-bg"
        style={{
          backgroundImage: 'linear-gradient(rgba(7,45,98,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(7,45,98,.025) 1px,transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      >
        <div className="w-full max-w-sm animate-rise-in">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-brand-blue flex items-center justify-center">
              <span className="font-serif text-accent-gold text-lg font-medium">R</span>
            </div>
            <div>
              <p className="font-semibold text-text-primary text-sm">RITMO</p>
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-tertiary">Fleet Console</p>
            </div>
          </div>

          <div className="mb-7">
            <h1 className="font-serif text-3xl font-medium tracking-tight text-text-primary">Welcome back</h1>
            <p className="text-text-secondary mt-1 text-sm">Sign in to your admin account to continue</p>
          </div>

          <div
            className="rounded-2xl border border-border p-7"
            style={{ background: 'rgba(255,255,255,.9)', backdropFilter: 'blur(8px)', boxShadow: '0 4px 12px rgba(7,45,98,.08),0 14px 32px rgba(7,45,98,.1)' }}
          >
            <Suspense>
              <LoginForm />
            </Suspense>
          </div>

          <p className="text-center text-xs text-text-tertiary mt-6 font-mono tracking-wider uppercase">
            RITMO Fleet Management
          </p>
        </div>
      </div>
    </div>
  );
}
