import { clsx, type ClassValue } from 'clsx';
import type { PaymentMethod, PaymentStatus } from '@/types/database';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function currency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 11) return phone;
  return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
}

export function paymentMethodLabel(method: PaymentMethod) {
  return { pix: 'PIX', cash: 'Dinheiro', card: 'Cartão' }[method] ?? method;
}

export function paymentStatusLabel(status: PaymentStatus) {
  return {
    pending: 'Pendente',
    awaiting_confirmation: 'Aguardando confirmação',
    paid: 'Pago',
    failed: 'Falhou',
    refunded: 'Estornado'
  }[status] ?? status;
}
