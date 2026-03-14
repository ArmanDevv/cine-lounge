import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLocation, useNavigate } from 'react-router-dom';
import { subscriptionService, Plan } from '@/services/subscriptionService';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const query = useQuery();
  const planId = query.get('plan') || '';
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [razorpayKey, setRazorpayKey] = useState('');
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const { user, setUser } = useAuthStore();
  const toast = useToast().toast;
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      subscriptionService.getPlans(),
      subscriptionService.getRazorpayKey(),
    ])
      .then(([plans, key]) => {
        const found = plans.find(p => p.id === planId);
        setPlan(found || null);
        setRazorpayKey(key);
      })
      .catch((e) => {
        console.error('Failed to load data', e);
        toast({ title: 'Error', description: 'Failed to load payment details', variant: 'destructive' });
      })
      .finally(() => setLoading(false));

    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log('Razorpay script loaded');
      setScriptLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      toast({ title: 'Error', description: 'Failed to load payment gateway', variant: 'destructive' });
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [planId, toast]);

  useEffect(() => {
    // If planId is explicitly 'free' or plan not found, redirect to pricing
    if (!loading && (!plan || planId === 'free')) {
      navigate('/pricing');
    }
  }, [loading, plan, planId, navigate]);

  const handlePayment = async () => {
    if (!plan || !razorpayKey || !user || !scriptLoaded) {
      toast({
        title: 'Error',
        description: scriptLoaded ? 'Missing payment details' : 'Payment gateway not ready. Please wait...',
        variant: 'destructive',
      });
      return;
    }

    if (!window.Razorpay) {
      console.error('Razorpay not available on window');
      toast({
        title: 'Error',
        description: 'Payment gateway failed to load',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      // Step 1: Create order on backend
      console.log('Creating order for plan:', plan.id);
      const orderData = await subscriptionService.createOrder(plan.id);
      console.log('Order created:', orderData);

      // Step 2: Open Razorpay Checkout
      const options = {
        key: razorpayKey,
        amount: orderData.amount,
        currency: 'INR',
        name: 'Cine-Lounge',
        description: `${plan.name} Plan Subscription`,
        order_id: orderData.id,
        prefill: {
          name: user.username,
          email: user.email,
        },
        theme: {
          color: '#7c3aed',
        },
        handler: async (response: any) => {
          try {
            console.log('Payment successful, verifying...', response);
            // Step 3: Verify payment on backend
            const verifyResponse = await subscriptionService.verifyPayment(
              orderData.id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              plan.id
            );

            // Step 4: Update user and show success
            toast({
              title: 'Success!',
              description: `Subscription activated for ${plan.name}`,
            });

            if (user) {
              setUser({ ...user, subscription: verifyResponse.subscription });
            }

            setTimeout(() => navigate('/profile'), 1500);
          } catch (err: any) {
            console.error('Verification error:', err);
            toast({
              title: 'Verification Failed',
              description: err.message || 'Could not verify payment',
              variant: 'destructive',
            });
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal dismissed');
            setSubmitting(false);
            toast({
              title: 'Cancelled',
              description: 'Payment was not completed',
            });
          },
        },
      };

      console.log('Opening Razorpay with options:', options);
      const razorpayWindow = new window.Razorpay(options);
      razorpayWindow.open();
    } catch (err: any) {
      console.error('Payment error:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to initiate payment',
        variant: 'destructive',
      });
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!plan) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Invalid plan</div>;

  return (
    <div className="min-h-screen pt-20 px-4">
      <h1 className="text-2xl font-bold mb-4">Checkout</h1>
      <div className="max-w-md mx-auto p-6 border rounded-lg">
        <h2 className="text-xl font-semibold mb-2">{plan.name}</h2>
        <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
        <p className="text-3xl font-bold mb-1">₹{plan.price}</p>
        <p className="text-xs text-muted-foreground mb-6">{plan.durationDays} days access</p>
        <Button
          className="w-full btn-cinema"
          onClick={handlePayment}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            'Pay with UPI/Card'
          )}
        </Button>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          💳 Secure payment powered by Razorpay
        </p>
      </div>
    </div>
  );
}

