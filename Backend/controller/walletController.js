import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import axios from 'axios';
import FormData from 'form-data';
import path from 'path';
import fs from 'fs';
import { uploadToGCS } from '../utils/gcs.js';
const EASYSLIP_API_KEY = () => process.env.EASYSLIP_API_KEY?.trim();

// ──────────────────────────────────────────────
// POST /api/wallet/topup
// ──────────────────────────────────────────────
export const topupWallet = async (req, res) => {
  try {
    const { amount } = req.body;
    const numAmount = parseFloat(amount);

    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ message: 'กรุณาระบุจำนวนเงินที่ถูกต้อง' });
    }
    if (!req.file) {
      return res.status(400).json({ 
        status: 'ANOMALY',
        code: 'MISSING_FILE',
        message: 'กรุณาแนบสลิปโอนเงินเพื่อดำเนินการต่อ' 
      });
    }

    // 🛡️ [FIX] Read buffer BEFORE uploading to GCS (because uploadToGCS deletes the file)
    const fileBuffer = req.file.buffer || (req.file.path ? fs.readFileSync(req.file.path) : null);
    if (!fileBuffer) throw new Error("ไม่สามารถอ่านข้อมูลไฟล์สลิปได้");

    // ── อัปโหลดสลิปขึ้น GCS เพื่อเก็บเป็นหลักฐานถาวร ──
    const slipUrl = await uploadToGCS(req.file);

    const apiKey = EASYSLIP_API_KEY();
    if (!apiKey) {
      return res.status(500).json({ message: 'ระบบยังไม่ได้ตั้งค่า EasySlip API Key' });
    }

    // ── STEP 2: Call EasySlip API using URL (Most robust for Hosted Environments) ──
    let slipData = null;
    let lastErrorMsg = '';

    console.log('🚀 Calling EasySlip v2 via GCS URL:', slipUrl);
    try {
      const response = await axios.post(
        'https://developer.easyslip.com/api/v2/verify',
        { url: slipUrl },
        {
          headers: {
            Authorization: apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      slipData = response.data;
    } catch (urlErr) {
      lastErrorMsg = urlErr.response?.data?.message || urlErr.message;
      console.warn('⚠️ EasySlip URL verification failed, trying fallback scan...', lastErrorMsg);
      
      // FALLBACK: If URL fails, try Method A: QR Payload
      const qrPayload = await scanQRFromBuffer(fileBuffer);
      if (qrPayload) {
        try {
          const response = await axios.post(
            'https://developer.easyslip.com/api/v2/verify',
            { payload: qrPayload },
            {
              headers: {
                Authorization: apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
            }
          );
          slipData = response.data;
        } catch (qrErr) {
          lastErrorMsg = qrErr.response?.data?.message || qrErr.message;
        }
      }
    }

    if (!slipData) {
       return res.status(400).json({
          status: 'ANOMALY',
          code: 'VERIFICATION_FAILED',
          message: `ไม่สามารถตรวจสอบสลิปได้: ${lastErrorMsg} (กรุณาใช้สลิปที่มี QR Code ที่ชัดเจน)`,
          debug: {
            urlUsed: !!slipUrl,
            timestamp: new Date().toISOString()
          }
       });
    }

    // ── STEP 3: Validate response ──
    const isSuccess = slipData?.status === 200 || slipData?.success === true;
    if (!isSuccess) {
      const errCode = slipData?.message || 'unknown_error';
      return res.status(400).json({ 
        status: 'ANOMALY', 
        code: 'VALIDATION_FAILED',
        message: easyslipErrorMsg(errCode) 
      });
    }

    const { amount: actualAmount, transRef } = parseSlipData(slipData);
    const receiverName = 
      slipData?.data?.receiver?.displayName || 
      slipData?.data?.receiver?.name || 
      slipData?.data?.receiver?.account?.name?.th || 
      slipData?.data?.receiver?.account?.name?.en || 
      '';
    
    console.log(`💰 Amount from slip: ${actualAmount}, Requested: ${numAmount}`);
    console.log(`🔑 TransRef: ${transRef}`);
    console.log(`🏦 Receiver: ${receiverName}`);

    if (actualAmount === undefined || actualAmount === null) {
      return res.status(400).json({ status: 'ANOMALY', code: 'READ_ERROR', message: 'ไม่สามารถอ่านยอดเงินจากสลิปนี้ได้' });
    }

    // 🔒 [SECURITY] Check Receiver Name if configured (Lenient matching)
    const EXPECTED_RECEIVER = process.env.PAYMENT_RECEIVER_NAME;
    if (EXPECTED_RECEIVER && receiverName) {
      const cleanReceiver = receiverName.replace(/\s+/g, '').toLowerCase();
      const cleanExpected = EXPECTED_RECEIVER.replace(/\s+/g, '').toLowerCase();
      
      const isMatch = cleanReceiver.includes(cleanExpected) || cleanExpected.includes(cleanReceiver);
      
      if (!isMatch) {
         console.warn(`🚨 SECURITY ALERT: Receiver mismatch! Expected: ${EXPECTED_RECEIVER}, Got: ${receiverName}`);
         
         await AuditLog.create({
           userId: req.user._id || req.user.id,
           action: 'FRAUD_ATTEMPT',
           severity: 'high',
           details: { type: 'RECEIVER_MISMATCH', expected: EXPECTED_RECEIVER, got: receiverName, slipData },
           ip: req.ip,
           userAgent: req.headers['user-agent']
         });

         return res.status(400).json({ 
            status: 'ANOMALY', 
            code: 'RECEIVER_MISMATCH',
            message: `❌ ชื่อผู้รับในสลิป (${receiverName}) ไม่ตรงกับชื่อบริษัทในระบบ (${EXPECTED_RECEIVER}) กรุณาโอนเงินเข้าบัญชีที่ถูกต้อง` 
         });
      }
    }

    if (Math.abs(actualAmount - numAmount) > 1) {
      return res.status(400).json({
        status: 'ANOMALY',
        code: 'AMOUNT_MISMATCH',
        message: `ยอดเงินในสลิป (฿${actualAmount}) ไม่ตรงกับที่คุณระบุ (฿${numAmount})`,
      });
    }

    if (!transRef) {
      return res.status(400).json({ status: 'ANOMALY', code: 'REF_MISSING', message: 'ไม่พบเลขอ้างอิงของสลิปนี้' });
    }

    const existingTx = await Transaction.findOne({ transRef });
    if (existingTx) {
      // 🛡️ Record Audit Log for Attempted Reuse
      await AuditLog.create({
        userId: req.user._id || req.user.id,
        action: 'SECURITY_ALERT',
        severity: 'medium',
        details: {
          type: 'DUPLICATE_SLIP_REUSE',
          transRef,
          message: 'User attempted to reuse a validated slip'
        },
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.status(400).json({ 
        status: 'ANOMALY',
        code: 'DUPLICATE_SLIP',
        message: 'สลิปนี้ถูกใช้งานไปแล้วในระบบ ไม่สามารถเติมซ้ำได้' 
      });
    }

    // ── STEP 4: Save & update balance (Atomic Transaction) ──
    const coinsToAdd = numAmount / 10; 
    
    // Start Session for Atomicity
    const mongoose = (await import('mongoose')).default;
    let session = null;
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (sErr) {
      console.warn('⚠️ MongoDB Sessions not supported (Local/Standalone). Proceeding without transaction.');
      session = null; 
    }

    try {
      const txData = {
        user:      req.user._id || req.user.id,
        type:      'TOPUP',
        amount:    coinsToAdd,
        status:    'completed',
        slipUrl:   slipUrl,
        reference: `EASYSLIP_${transRef}`,
        transRef:  transRef,
      };

      const tx = new Transaction(txData);
      await tx.save(session ? { session } : {});

      const updatedUser = await User.findByIdAndUpdate(
        req.user._id || req.user.id,
        { $inc: { coinBalance: coinsToAdd } },
        { session: session || undefined, new: true }
      );

      if (!updatedUser) throw new Error('ERR_USER_NOT_FOUND');

      if (session) {
        await session.commitTransaction();
        session.endSession();
      }

      // ⚡ Emit Real-time Balance Update via Socket.io
      const io = req.app.get('io');
      if (io) {
        io.to(updatedUser._id.toString()).emit('balance_update', {
          coinBalance: updatedUser.coinBalance,
          message: `RECEIVED: +${coinsToAdd} Coins`
        });
      }

      return res.status(200).json({
        message:     `เติมเงินสำเร็จ! คุณได้รับ ${coinsToAdd} Coins (จากการโอน ฿${numAmount})`,
        coinBalance: updatedUser.coinBalance,
        transaction: tx,
      });

    } catch (dbErr) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      throw dbErr;
    }

  } catch (err) {
    const errDetail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    console.error('❌ Wallet topup error:', errDetail);
    
    // 🔥 [CRITICAL FIX] Ensure even system errors trigger the Anomaly Modal
    return res.status(400).json({
      status: 'ANOMALY',
      code: 'SYSTEM_ERROR',
      message: 'ระบบไม่สามารถประมวลผลสลิปได้ในขณะนี้: ' + (err.message || 'Unknown Error')
    });
  }
};

// ──────────────────────────────────────────────
// GET /api/wallet/transactions
// ──────────────────────────────────────────────
export const getWalletTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id || req.user.id })
      .sort({ createdAt: -1 });
    return res.json(transactions);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ──────────────────────────────────────────────
// POST /api/wallet/withdraw (Freelancer)
// ──────────────────────────────────────────────
export const requestWithdrawal = async (req, res) => {
  try {
    const { amount, bankName, accountName, accountNumber } = req.body;
    const userId = req.user._id || req.user.id;
    const numAmount = Number(amount);

    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ 
        status: 'ANOMALY',
        code: 'INVALID_AMOUNT',
        message: 'กรุณาระบุจำนวนเหรียญที่ต้องการถอนที่ถูกต้อง' 
      });
    }
    if (!bankName || !accountName || !accountNumber) {
      return res.status(400).json({ 
        status: 'ANOMALY',
        code: 'MISSING_BANK_INFO',
        message: 'กรุณากรอกข้อมูลบัญชีธนาคารสำหรับการถอนเงินให้ครบถ้วน' 
      });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'ไม่พบผู้ใช้งาน' });

    // 🔒 [SECURITY] Check for existing pending withdrawal to prevent spamming
    const existingPending = await Transaction.findOne({ user: userId, type: 'WITHDRAW', status: 'pending' });
    if (existingPending) {
      return res.status(400).json({ 
        status: 'ANOMALY',
        code: 'PENDING_EXISTS',
        message: 'คุณมีคำขอถอนเงินที่รอการอนุมัติอยู่แล้ว 1 รายการ กรุณารอให้รายการเดิมสำเร็จก่อนแจ้งถอนใหม่' 
      });
    }

    if ((user.coinBalance || 0) < numAmount) {
      return res.status(400).json({ 
        status: 'ANOMALY',
        code: 'INSUFFICIENT_BALANCE',
        message: `ยอด Coin ของคุณไม่เพียงพอสำหรับการถอน (มี ${user.coinBalance} Coins)` 
      });
    }

    // Save bank account info for future use
    user.bankAccount = { bankName, accountName, accountNumber };
    await user.save();

    const thbAmount = numAmount * 10; // 1 Coin = 10 THB
    const tx = new Transaction({
      user: userId,
      type: 'WITHDRAW',
      amount: numAmount,
      status: 'pending',
      reference: `BANK:${bankName}|${accountNumber}|${accountName}|THB:${thbAmount}`,
    });
    await tx.save();

    return res.status(201).json({
      message: `ส่งคำขอถอนเงิน ${numAmount} Coins (฿${thbAmount}) สำเร็จแล้ว กรุณารอการอนุมัติจากผู้ดูแลระบบ`,
      transaction: tx,
    });
  } catch (err) {
    console.error('Withdrawal request error:', err);
    return res.status(500).json({ message: err.message });
  }
};

// ──────────────────────────────────────────────
// GET /api/wallet/admin/withdrawals (Admin)
// ──────────────────────────────────────────────
export const getAdminWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Transaction.find({ type: 'WITHDRAW' })
      .populate('user', 'name email profileImage bankAccount coinBalance')
      .sort({ createdAt: -1 });
    return res.json(withdrawals);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ──────────────────────────────────────────────
// PATCH /api/wallet/admin/withdrawals/:id (Admin)
// ──────────────────────────────────────────────
export const updateWithdrawalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'completed' or 'failed'

    if (!['completed', 'failed'].includes(status)) {
      return res.status(400).json({ message: 'สถานะไม่ถูกต้อง ใช้ completed หรือ failed' });
    }

    const tx = await Transaction.findById(id).populate('user');
    if (!tx) return res.status(404).json({ message: 'ไม่พบรายการนี้' });
    if (tx.status !== 'pending') {
      return res.status(400).json({ message: 'รายการนี้ถูกจัดการไปแล้ว' });
    }

    // Start Session for Atomicity
    const mongoose = (await import('mongoose')).default;
    let session = null;
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (sErr) { session = null; }

    try {
      // Only deduct coins when actually approving
      if (status === 'completed') {
        const updatedUser = await User.findOneAndUpdate(
          { _id: tx.user._id, coinBalance: { $gte: tx.amount } },
          { $inc: { coinBalance: -tx.amount } },
          { session, new: true }
        );
        if (!updatedUser) {
          throw new Error('INSUFFICIENT_BALANCE_DURING_APPROVAL');
        }
      }

      // 🧾 Handle optional Proof Image upload (Admin provides proof of transfer)
      if (status === 'completed' && req.file) {
        try {
          const proofUrl = await uploadToGCS(req.file);
          tx.proofImage = { url: proofUrl };
        } catch (uploadErr) {
          console.error('⚠️ Receipt upload failed:', uploadErr);
          // We continue but log it; missing receipt shouldn't block the logic unless strictly required
        }
      }

      tx.status = status;
      await tx.save({ session });

      if (session) {
        await session.commitTransaction();
        session.endSession();
      }

      // ⚡ Emit Real-time Update to User
      const io = req.app.get('io');
      if (io && tx.user) {
        const uId = tx.user._id.toString();
        // Fetch current user for accurate balance in socket
        const updatedUserObj = await User.findById(uId);
        if (updatedUserObj) {
          io.to(uId).emit('balance_update', {
            coinBalance: updatedUserObj.coinBalance,
            message: status === 'completed' ? 'WITHDRAWAL_APPROVED' : 'WITHDRAWAL_REJECTED'
          });
        }
      }

      // 🛡️ Record Audit Log
      await AuditLog.create({
        action: 'WITHDRAWAL_APPROVAL',
        severity: 'low',
        details: { txId: tx._id, status, amount: tx.amount },
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.json({
        message: status === 'completed' ? '✅ อนุมัติการถอนเงินสำเร็จ ตัดยอด Coin แล้ว' : '❌ ปฏิเสธคำขอถอนเงินแล้ว',
        transaction: tx,
      });

    } catch (dbErr) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      return res.status(400).json({ 
        message: dbErr.message === 'INSUFFICIENT_BALANCE_DURING_APPROVAL' 
          ? 'ยอด Coin ของผู้ใช้ไม่เพียงพอแล้ว (อาจถูกใช้งานไปก่อนหน้า)' 
          : 'เกิดข้อผิดพลาดในการปรับสถานะรายการ' 
      });
    }

  } catch (err) {
    console.error('Admin withdrawal update error:', err);
    return res.status(500).json({ message: err.message });
  }
};

// ──────────────────────────────────────────────
// GET /api/wallet/admin/audit-logs (Admin)
// ──────────────────────────────────────────────
export const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('userId', 'name email profileImage')
      .sort({ createdAt: -1 })
      .limit(50);
    return res.json(logs);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────

/**
 * แปลง Error Code จาก EasySlip เป็นข้อความภาษาไทยที่เข้าใจง่าย
 */
function easyslipErrorMsg(code) {
  const msgs = {
    '101': 'API Key ไม่ถูกต้อง',
    '102': 'ยังไม่ได้ระบุข้อมูลที่จำเป็น',
    '301': 'สลิปนี้ถูกใช้งานไปแล้วในระบบอื่น',
    '401': 'ไม่พบข้อมุลสลิปนี้ในระบบธนาคาร (สลิปปลอม)',
    '403': 'ระบบธนาคารไม่ตอบสนอง กรุณาลองใหม่ภายหลัง',
    'duplicate': 'สลิปนี้เคยถูกใช้เติมเงินในระบบเราแล้ว',
    'slip_not_found': 'ไม่พบข้อมูลสลิปนี้ในระบบธนาคาร (สลิปอาจเก่าเกิน 24 ชม. หรือเป็นสลิปจำลอง)',
    'not_found': 'ไม่พบข้อมูลสลิป (กรุณาใช้สลิปที่มี QR Code ที่ชัดเจน)',
    'invalid_payload': 'ข้อมูลใน QR Code ไม่ถูกต้อง',
    'insufficient_fund': 'ยอดเงินในสลิปไม่เพียงพอ'
  };
  return msgs[code] || `เกิดข้อผิดพลาด: ${code} (สลิปอาจไม่ถูกต้อง)`;
}

/**
 * สแกนหา QR Code จากรูปภาพ Buffer
 */
async function scanQRFromBuffer(buffer) {
  try {
    const { default: sharp } = await import('sharp');
    const { default: jsQR } = await import('jsqr');

    const image = sharp(buffer);
    const { data, info } = await image
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const code = jsQR(new Uint8ClampedArray(data), info.width, info.height);
    return code ? code.data : null;
  } catch (err) {
    console.warn('⚠️ QR Scan process failed:', err.message);
    return null;
  }
}

/**
 * แกะข้อมูลสำคัญ (ยอดเงิน, รหัสอ้างอิง) จาก API Response ของ EasySlip
 */
function parseSlipData(slipData) {
  // รองรับรูปแบบ payload ที่ต่างกันของ v1 และ v2
  const d = slipData.data || slipData;
  return {
    amount: d.amount?.amount || d.amount || 0,
    transRef: d.transRef || d.referenceNo || d.payload || 'unknown'
  };
}
