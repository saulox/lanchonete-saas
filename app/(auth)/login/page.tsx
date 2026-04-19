'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Mode = 'signin' | 'signup' | 'otp';

export default function LoginPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signin');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptsPromotions, setAcceptsPromotions] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handlePasswordSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  async function handleSignUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback?next=/dashboard` : undefined,
        data: {
          full_name: fullName,
          phone: phone || null,
          accepts_promotions: acceptsPromotions,
          role: 'customer'
        }
      }
    });

    setMessage(error ? error.message : 'Cadastro enviado. Confira seu e-mail para confirmar a conta e depois entre com senha.');
    setLoading(false);
  }

  async function handleEmailOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback?next=/dashboard` : undefined
      }
    });

    setMessage(error ? error.message : 'Link mágico enviado. Abra o e-mail para entrar no painel.');
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="card w-full max-w-md p-6 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-600">Acesso</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">Entrar com e-mail</h1>
        <p className="mt-3 text-sm text-slate-500">Use senha ou link mágico. O telefone continua como dado cadastral do cliente.</p>

        <div className="mt-6 grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1">
          <button className={mode === 'signin' ? 'btn-primary w-full' : 'btn-secondary w-full'} onClick={() => setMode('signin')} type="button">Senha</button>
          <button className={mode === 'signup' ? 'btn-primary w-full' : 'btn-secondary w-full'} onClick={() => setMode('signup')} type="button">Cadastro</button>
          <button className={mode === 'otp' ? 'btn-primary w-full' : 'btn-secondary w-full'} onClick={() => setMode('otp')} type="button">OTP</button>
        </div>

        {mode === 'signin' ? (
          <form onSubmit={handlePasswordSignIn} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">E-mail</label>
              <input className="input" type="email" placeholder="voce@exemplo.com" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Senha</label>
              <input className="input" type="password" placeholder="********" value={password} onChange={(event) => setPassword(event.target.value)} />
            </div>
            <button className="btn-primary w-full" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
          </form>
        ) : null}

        {mode === 'signup' ? (
          <form onSubmit={handleSignUp} className="mt-6 space-y-4">
            <input className="input" placeholder="Nome completo" value={fullName} onChange={(event) => setFullName(event.target.value)} />
            <input className="input" type="email" placeholder="voce@exemplo.com" value={email} onChange={(event) => setEmail(event.target.value)} />
            <input className="input" type="password" placeholder="Crie uma senha" value={password} onChange={(event) => setPassword(event.target.value)} />
            <input className="input" placeholder="Telefone cadastral (opcional)" value={phone} onChange={(event) => setPhone(event.target.value)} />
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={acceptsPromotions} onChange={(event) => setAcceptsPromotions(event.target.checked)} />
              Aceito receber promoções
            </label>
            <button className="btn-primary w-full" disabled={loading}>{loading ? 'Criando conta...' : 'Criar conta'}</button>
          </form>
        ) : null}

        {mode === 'otp' ? (
          <form onSubmit={handleEmailOtp} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">E-mail</label>
              <input className="input" type="email" placeholder="voce@exemplo.com" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <button className="btn-primary w-full" disabled={loading}>{loading ? 'Enviando...' : 'Enviar link mágico'}</button>
          </form>
        ) : null}

        {message ? <p className="mt-4 text-sm text-slate-600">{message}</p> : null}
      </div>
    </main>
  );
}
