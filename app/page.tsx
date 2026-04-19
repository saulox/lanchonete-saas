import Link from 'next/link';

const features = [
  'Painel desktop para atendimento, caixa e cozinha',
  'Layout mobile para cliente e equipe',
  'Login por e-mail com senha ou OTP',
  'Fila de pedidos em tempo real com Supabase Realtime',
  'Promoções, cupons e consentimento de marketing',
  'Perfis de acesso: admin, operador, cozinha e cliente'
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-12">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-600">Next.js + Supabase</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-6xl">Lanchonete SaaS</h1>
          </div>
          <div className="hidden gap-3 md:flex">
            <Link href="/login" className="btn-secondary">Entrar</Link>
            <Link href="/m" className="btn-primary">Abrir mobile</Link>
          </div>
        </header>

        <section className="mt-16 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <h2 className="max-w-3xl text-3xl font-bold leading-tight text-slate-900 md:text-5xl">
              Base pronta para operação de pedidos, promoções e monitoramento em tempo real.
            </h2>
            <p className="mt-5 max-w-2xl text-lg text-slate-600">
              Projeto inicial voltado para subir no Git e evoluir em produção. Já vem com estrutura de autenticação por e-mail,
              dashboard operacional, tela mobile e schema SQL do Supabase.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dashboard" className="btn-primary">Painel desktop</Link>
              <Link href="/m" className="btn-secondary">Experiência mobile</Link>
            </div>
          </div>
          <div className="card grid gap-4 p-6">
            {features.map((feature) => (
              <div key={feature} className="rounded-2xl bg-slate-50 p-4 text-sm font-medium text-slate-700">
                {feature}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
