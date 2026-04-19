'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Megaphone, ShoppingBag, Users, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/dashboard', label: 'Visão geral', icon: LayoutDashboard },
  { href: '/dashboard/operations', label: 'Fila de pedidos', icon: ShoppingBag },
  { href: '/dashboard/finance', label: 'Financeiro', icon: Wallet },
  { href: '/dashboard/promotions', label: 'Promoções', icon: Megaphone },
  { href: '/dashboard/users', label: 'Usuários', icon: Users }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white lg:block">
      <div className="flex h-full flex-col p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-600">Lanchonete SaaS</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">Operação</h2>
        </div>
        <nav className="mt-8 space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition',
                  pathname === item.href ? 'bg-orange-500 text-white' : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
