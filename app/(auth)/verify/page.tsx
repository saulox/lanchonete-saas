import Link from 'next/link';

export default function VerifyPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="card w-full max-w-md p-6 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-600">Verificação</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">Confira seu e-mail</h1>
        <p className="mt-4 text-sm text-slate-600">Nesta versão, o acesso foi ajustado para e-mail com senha ou link mágico. Abra o e-mail enviado pelo Supabase e finalize a autenticação pelo link recebido.</p>
        <div className="mt-6">
          <Link href="/login" className="btn-primary w-full">Voltar ao login</Link>
        </div>
      </div>
    </main>
  );
}
