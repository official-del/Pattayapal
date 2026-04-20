import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  employer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  freelancer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  budget: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  progressStage: {
    type: String,
    enum: ['AWAITING_START', 'IN_PROGRESS', 'SUBMITTED', 'REVISING', 'COMPLETED'],
    default: 'AWAITING_START'
  },
  escrowAmount: { type: Number, default: 0 },
  paymentStatus: { 
    type: String, 
    enum: ['unpaid', 'escrow_held', 'released', 'refunded'], 
    default: 'unpaid' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

const Job = mongoose.model('Job', jobSchema);
export default Job;
