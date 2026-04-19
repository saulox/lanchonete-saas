import { createClient } from '@/lib/supabase/server';

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, role, accepts_promotions, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-600">Acessos</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">Perfis de acesso</h1>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">Perfil</th>
                <th className="px-4 py-3">Promoções</th>
              </tr>
            </thead>
            <tbody>
              {(users ?? []).map((user) => (
                <tr key={user.id} className="border-t border-slate-200">
                  <td className="px-4 py-3">{user.full_name ?? 'Sem nome'}</td>
                  <td className="px-4 py-3">{user.email ?? "Sem e-mail"}</td>
                  <td className="px-4 py-3">{user.phone ?? "Sem telefone"}</td>
                  <td className="px-4 py-3">{user.role}</td>
                  <td className="px-4 py-3">{user.accepts_promotions ? 'Sim' : 'Não'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
