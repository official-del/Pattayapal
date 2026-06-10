import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['TOPUP', 'PAY_JOB', 'EARN_JOB', 'WITHDRAW', 'REFUND', 'GAS_REFILL'], 
    required: true 
  },
  amount: { type: Number, required: true, min: 0 },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed'], 
    default: 'pending' 
  },
  slipUrl: { type: String }, // For TOPUP
  targetType: { type: String, enum: ['coins', 'gas'], default: 'coins' }, // What is being topped up
  proofImage: { 
    url: { type: String },
    publicId: { type: String }
  }, // For WITHDRAWAL receipts
  reference: { type: String }, // E.g., Job ID
  transRef: { type: String, unique: true, sparse: true }, // Unique bank transaction ID from EasySlip
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

transactionSchema.index({ user: 1, type: 1, status: 1, createdAt: -1 });
transactionSchema.index(
  { user: 1, type: 1 },
  { unique: true, partialFilterExpression: { type: 'WITHDRAW', status: { $in: ['pending', 'processing'] } } }
);

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
