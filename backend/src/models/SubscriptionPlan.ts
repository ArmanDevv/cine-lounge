import mongoose, { Document } from 'mongoose';

export interface ISubscriptionPlan extends Document {
  planId: string;
  name: string;
  price: number; // in INR
  durationDays: number;
  description?: string;
}

const subscriptionPlanSchema = new mongoose.Schema(
  {
    planId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    durationDays: { type: Number, required: true },
    description: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ISubscriptionPlan>('SubscriptionPlan', subscriptionPlanSchema);
