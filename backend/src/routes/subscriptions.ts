import express from 'express';
import { authenticate } from '../middleware/auth';
import User from '../models/User';
import SubscriptionPlan from '../models/SubscriptionPlan';
import crypto from 'crypto';
import axios from 'axios';

const router = express.Router();

// Razorpay credentials from env
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

// get available subscription plans (public) - reads from DB and seeds defaults if empty
router.get('/plans', async (req, res) => {
  try {
    let plans = await SubscriptionPlan.find().lean();
    if (!plans || plans.length === 0) {
      const defaultPlans = [
        { planId: 'basic', name: 'Basic', price: 99, durationDays: 30, description: 'Watch ad‑free in SD for one month.' },
        { planId: 'premium', name: 'Premium', price: 299, durationDays: 30, description: 'Unlock HD streaming and early releases.' },
        { planId: 'yearly', name: 'Yearly', price: 999, durationDays: 365, description: 'Full access for a year (save 20%).' },
      ];
      await SubscriptionPlan.insertMany(defaultPlans);
      plans = await SubscriptionPlan.find().lean();
    }

    // Map DB docs to the API shape expected by frontend
    const response = plans.map((p: any) => ({ id: p.planId, name: p.name, price: p.price, durationDays: p.durationDays, description: p.description }));
    res.json(response);
  } catch (error: any) {
    console.error('Get plans error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// get Razorpay key (public) - frontend needs this to initialize checkout
router.get('/key', (req, res) => {
  res.json({ key: RAZORPAY_KEY_ID });
});

// create razorpay order (authenticated)
router.post('/order', authenticate, async (req, res) => {
  try {
    console.log('Create order called. Body:', req.body);
    const { planId } = req.body;
    const plan = await SubscriptionPlan.findOne({ planId }).lean();
    if (!plan) {
      return res.status(400).json({ message: 'Invalid plan' });
    }

    const userId = (req as any).userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create Razorpay order via API
    const orderData = {
      amount: plan.price * 100, // convert to paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: {
        userId,
        planId,
        userName: user.username,
        userEmail: user.email,
      },
    };

    // Call Razorpay API to create order using axios
    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
    const razorResp = await axios.post(
      'https://api.razorpay.com/v1/orders',
      orderData,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const order = razorResp.data;
    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error: any) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: error.message || 'Server error', stack: error.stack });
  }
});

// verify razorpay payment and activate subscription
router.post('/verify', authenticate, async (req, res) => {
  try {
    console.log('Verify payment called. Body:', req.body);
    const { orderId, paymentId, signature, planId } = req.body;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ message: 'Missing payment details' });
    }

    // Verify signature
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Signature verified - update user subscription
    const plan = await SubscriptionPlan.findOne({ planId }).lean();
    if (!plan) {
      return res.status(400).json({ message: 'Invalid plan' });
    }

    const userId = (req as any).userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Activate subscription
    user.subscription = {
      plan: plan.planId,
      status: 'active',
      expiresAt: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000),
    } as any;

    await user.save();

    res.json({
      message: 'Subscription activated',
      subscription: user.subscription,
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: error.message || 'Server error', stack: error.stack });
  }
});

// cancel subscription
router.post('/cancel', authenticate, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.subscription = {
      plan: 'free',
      status: 'cancelled',
    } as any;

    await user.save();

    res.json({
      message: 'Subscription cancelled',
      subscription: user.subscription,
    });
  } catch (error: any) {
    console.error('Cancel error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

export default router;
