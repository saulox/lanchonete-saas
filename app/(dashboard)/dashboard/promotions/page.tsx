import { PromotionList } from '@/components/promotion-list';

export default function PromotionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-600">Marketing</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">Promoções e campanhas</h1>
        <p className="mt-2 text-sm text-slate-500">Promoções vinculadas ao consentimento do cliente para comunicação.</p>
      </div>
      <PromotionList />
    </div>
  );
}
