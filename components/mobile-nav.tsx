'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, ShoppingBag, Tag, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/m', label: 'Início', icon: House },
  { href: '/m?tab=pedidos', label: 'Pedidos', icon: ShoppingBag },
  { href: '/m?tab=promos', label: 'Promos', icon: Tag },
  { href: '/m?tab=conta', label: 'Conta', icon: User }
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-4 py-3 md:hidden">
      <div className="grid grid-cols-4 gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === '/m';
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium',
                active ? 'text-orange-600' : 'text-slate-500'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
