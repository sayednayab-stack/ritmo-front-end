'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { Plane } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { errorMessage } from '@/lib/api';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post('/api/auth/login', { username, password });
      const next = params.get('next');
      // Only follow same-site relative paths.
      router.replace(next && next.startsWith('/') && !next.startsWith('//') ? next : '/');
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, 'Login failed'));
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Input
        label="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoComplete="username"
        autoFocus
        required
      />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        required
      />
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" loading={loading}>
        Sign in
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-secondary-200 p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
            <Plane className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-secondary-900 leading-tight">RITMO</h1>
            <p className="text-xs text-secondary-500">Fleet management console</p>
          </div>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
