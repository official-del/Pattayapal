import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['TOPUP', 'PAY_JOB', 'EARN_JOB', 'WITHDRAW', 'REFUND'], 
    required: true 
  },
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed'], 
    default: 'pending' 
  },
  slipUrl: { type: String }, // For TOPUP
  proofImage: { 
    url: { type: String },
    publicId: { type: String }
  }, // For WITHDRAWAL receipts
  reference: { type: String }, // E.g., Job ID
  transRef: { type: String, unique: true, sparse: true }, // Unique bank transaction ID from EasySlip
  createdAt: { type: Date, default: Date.now }
});

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
