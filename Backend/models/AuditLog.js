import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { 
    type: String, 
    enum: ['FRAUD_ATTEMPT', 'SECURITY_ALERT', 'BALANCE_ADJUSTMENT', 'WITHDRAWAL_APPROVAL', 'SYSTEM_CONFIG_CHANGE'],
    required: true 
  },
  severity: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'], 
    default: 'low' 
  },
  details: { type: mongoose.Schema.Types.Mixed }, // JSON data about the event
  ip: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
