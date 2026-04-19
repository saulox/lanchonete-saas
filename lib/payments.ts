export type PaymentWebhookPayload = {
  order_id: string;
  reference?: string;
  provider?: string;
  status: 'pending' | 'awaiting_confirmation' | 'paid' | 'failed' | 'refunded';
};

export function getPixConfig() {
  return {
    key: process.env.NEXT_PUBLIC_PIX_KEY ?? '',
    holder: process.env.NEXT_PUBLIC_PIX_HOLDER ?? 'Lanchonete SaaS',
    city: process.env.NEXT_PUBLIC_PIX_CITY ?? 'SAO LUIS',
    qrCodeUrl: process.env.NEXT_PUBLIC_PIX_QR_CODE_URL ?? '',
    providerName: process.env.PAYMENT_PROVIDER_NAME ?? 'pix_manual',
    webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET ?? ''
  };
}

export function buildPixCopyPaste(orderId: string, total: number) {
  const { key, holder, city } = getPixConfig();
  if (!key) return null;
  return [
    'PIX',
    `CHAVE:${key}`,
    `FAVORECIDO:${holder}`,
    `CIDADE:${city}`,
    `PEDIDO:${orderId.slice(0, 8)}`,
    `VALOR:${total.toFixed(2)}`
  ].join('|');
}

export function buildPaymentReference(orderId: string) {
  return `PED-${orderId.slice(0, 8).toUpperCase()}`;
}

export function isWebhookAuthorized(signature: string | null) {
  const { webhookSecret } = getPixConfig();
  if (!webhookSecret) return false;
  return signature === webhookSecret;
}
