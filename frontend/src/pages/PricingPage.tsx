import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { subscriptionService, Plan } from '@/services/subscriptionService';
import { Loader2, Check } from 'lucide-react';

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const defaultPlans: Plan[] = [
      { id: 'basic', name: 'Basic', price: 99, description: 'Watch ad‑free in SD for one month.', durationDays: 30 },
      { id: 'premium', name: 'Premium', price: 299, description: 'Unlock HD streaming and early releases.', durationDays: 30 },
      { id: 'yearly', name: 'Yearly', price: 999, description: 'Full access for a year (save 20%).', durationDays: 365 },
    ];

    subscriptionService.getPlans()
      .then((p) => {
        if (!p || p.length === 0) {
          setPlans(defaultPlans);
        } else {
          setPlans(p);
        }
      })
      .catch((e) => {
        console.error('Failed to load plans, using fallback', e);
        setPlans(defaultPlans);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleRetry = () => {
    setLoading(true);
    subscriptionService.getPlans()
      .then((p) => setPlans(p || []))
      .catch((e) => {
        console.error('Retry failed', e);
      })
      .finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4 pb-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2">Simple, Transparent Pricing</h1>
        <p className="text-center text-muted-foreground mb-12">Choose the plan that fits your viewing habits</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.length === 0 ? (
            <div className="col-span-1 md:col-span-3 text-center text-muted-foreground">
              No subscription plans available right now. 
              <button className="ml-2 text-primary underline" onClick={handleRetry}>Retry</button>
            </div>
          ) : (
            plans.map((plan, idx) => (
            <div
              key={plan.id}
              className={`relative p-6 rounded-lg border transition-all ${
                idx === 1
                  ? 'border-primary bg-primary/5 ring-2 ring-primary md:scale-105'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {idx === 1 && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">POPULAR</span>
                </div>
              )}

              <h2 className="text-xl font-semibold mb-2">{plan.name}</h2>
              <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>

              <div className="mb-6">
                <span className="text-3xl font-bold">₹{plan.price}</span>
                <span className="text-muted-foreground ml-2">/ {plan.durationDays} days</span>
              </div>

              <Button
                className={`w-full mb-6 ${
                  idx === 1 ? 'btn-cinema' : 'bg-secondary hover:bg-secondary/80'
                }`}
                onClick={() => navigate(`/checkout?plan=${plan.id}`)}
              >
                Get Started
              </Button>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Watch ad-free</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>HD quality</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Offline downloads</span>
                </div>
                {plan.durationDays >= 365 && (
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Save 20%</span>
                  </div>
                )}
              </div>
            </div>
            ))
          )}
        </div>

        <div className="mt-12 p-6 bg-secondary/50 rounded-lg text-center">
          <h3 className="text-lg font-semibold mb-2">Cancel Anytime</h3>
          <p className="text-muted-foreground">
            No hidden charges. Cancel your subscription whenever you want from your profile.
          </p>
        </div>
      </div>
    </div>
  );
}

