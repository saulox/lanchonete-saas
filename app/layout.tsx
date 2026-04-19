import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lanchonete SaaS',
  description: 'Sistema SaaS de lanchonete com pedidos, promoções e operação em tempo real.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
