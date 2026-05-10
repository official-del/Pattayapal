import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import axios from 'axios';
import FormData from 'form-data';
import path from 'path';
import fs from 'fs';
import { uploadToGCS } from '../utils/gcs.js';
const EASYSLIP_API_KEY = () => process.env.EASYSLIP_API_KEY?.trim();

import Notification from '../models/Notification.js';

// ──────────────────────────────────────────────
// ADMIN: Adjust User Balance (Manual Injection)
// ──────────────────────────────────────────────
export const adminAdjustCoins = async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;
    const adminId = req.user._id || req.user.id;

    if (!userId || amount === undefined || amount === null) {
      return res.status(400).json({ message: 'Missing userId or amount' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const change = parseFloat(amount);
    if (isNaN(change) || !isFinite(change)) {
      return res.status(400).json({ message: 'Invalid amount: must be a valid number' });
    }
    if (Math.abs(change) > 10000000) {
      return res.status(400).json({ message: 'Coin adjustment cannot exceed ±10,000,000 per operation' });
    }

    const oldBalance = user.coinBalance || 0;
    const newBalance = oldBalance + change;
    if (newBalance < 0) {
      return res.status(400).json({ message: `ยอดเหรียญไม่พอสำหรับการหัก (มี ${oldBalance} Coins)` });
    }
    user.coinBalance = newBalance;
    await user.save();

    // Log the transaction
    const tx = new Transaction({
      user: userId,
      type: change >= 0 ? 'TOPUP' : 'WITHDRAW',
      amount: Math.abs(change),
      status: 'completed',
      reference: `ADMIN_ADJUST: ${reason || 'Manual Adjustment'}`,
    });
    await tx.save();

    // Log Audit
    await AuditLog.create({
      userId: adminId,
      action: 'BALANCE_ADJUSTMENT',
      severity: 'medium',
      details: {
        targetUser: user.email,
        oldBalance,
        newBalance: user.coinBalance,
        change,
        reason
      }
    });

    // Create Notification
    await Notification.create({
      recipient: userId,
      sender: adminId,
      type: 'system',
      text: `${change >= 0 ? '💰 ได้รับเหรียญจากระบบ' : '📉 เหรียญถูกหักโดยระบบ'}: แอดมินได้ปรับยอดเหรียญของคุณ ${change >= 0 ? '+' : ''}${change} Coins (${reason || 'ไม่ระบุเหตุผล'})`,
    });

    // Notify user via Socket
    const io = req.app.get('io');
    if (io) {
      io.to(userId.toString()).emit('balance_update', {
        coinBalance: user.coinBalance,
        title: change >= 0 ? 'เหรียญเข้าแล้ว!' : 'เหรียญถูกหัก!',
        message: `ยอดเหรียญของคุณถูกปรับเปลี่ยนโดยแอดมิน: ${change >= 0 ? '+' : ''}${change} Coins`,
        type: change >= 0 ? 'topup' : 'deduct'
      });
      io.to(userId.toString()).emit('new_notification');
    }

    return res.status(200).json({
      message: 'ปรับยอดเหรียญสำเร็จแล้ว',
      coinBalance: user.coinBalance
    });
  } catch (err) {
    console.error('Admin adjust coins error:', err);
    return res.status(500).json({ message: err.message });
  }
};

// ──────────────────────────────────────────────
// ADMIN: Adjust User Gas Energy
// ──────────────────────────────────────────────
export const adminAdjustGas = async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;
    const adminId = req.user._id || req.user.id;

    if (!userId || amount === undefined || amount === null) {
      return res.status(400).json({ message: 'Missing userId or amount' });
    }
    const change = parseFloat(amount);
    if (isNaN(change) || !isFinite(change)) {
      return res.status(400).json({ message: 'Invalid amount: must be a valid number' });
    }
    if (Math.abs(change) > 100) {
      return res.status(400).json({ message: 'Gas adjustment cannot exceed ±100% per operation' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const oldGas = user.gas || 0;
    // Clamp gas between 0 and 100
    user.gas = Math.min(100, Math.max(0, oldGas + change));
    await user.save();

    // Log Audit
    await AuditLog.create({
      userId: adminId,
      action: 'GAS_ADJUSTMENT',
      severity: 'medium',
      details: {
        targetUser: user.email,
        oldGas,
        newGas: user.gas,
        change,
        reason
      }
    });

    // Create Notification
    await Notification.create({
      recipient: userId,
      sender: adminId,
      type: 'system',
      text: `${change >= 0 ? '🔋 พลังงาน Gas เพิ่มขึ้น!' : '⚠️ พลังงาน Gas ถูกหัก!'}: แอดมินได้ปรับพลังงาน Gas ของคุณ ${change >= 0 ? '+' : ''}${change}% (${reason || 'ไม่ระบุเหตุผล'})`,
    });

    // Notify user via Socket
    const io = req.app.get('io');
    if (io) {
      io.to(userId.toString()).emit('balance_update', {
        gasBalance: user.gas,
        gas: user.gas,
        title: change >= 0 ? 'ได้รับ Gas เพิ่ม!' : 'Gas ถูกหัก!',
        message: `พลังงาน Gas ของคุณถูกปรับเปลี่ยนโดยแอดมิน: ${change >= 0 ? '+' : ''}${change}%`,
        type: change >= 0 ? 'topup' : 'deduct'
      });
      io.to(userId.toString()).emit('new_notification');
    }

    return res.status(200).json({
      message: 'ปรับพลังงาน Gas สำเร็จแล้ว',
      gasBalance: user.gas,
      gas: user.gas
    });
  } catch (err) {
    console.error('Admin adjust gas error:', err);
    return res.status(500).json({ message: err.message });
  }
};

// ──────────────────────────────────────────────
// USER: Refill Gas using Coins
// ──────────────────────────────────────────────
export const refillGas = async (req, res) => {
  try {
    const { percent } = req.body; // 25, 50, 75, 100
    const userId = req.user._id || req.user.id;

    if (![25, 50, 75, 100].includes(percent)) {
      return res.status(400).json({ message: 'ตัวเลือกการเติม Gas ไม่ถูกต้อง' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const cost = percent * 10; // 25 -> 250, 100 -> 1000
    if (user.coinBalance < cost) {
      return res.status(400).json({ message: `เหรียญไม่พอ (ต้องการ ${cost.toLocaleString()} Coins)` });
    }

    if ((user.gas || 0) >= 100) {
      return res.status(400).json({ message: 'พลังงาน Gas ของคุณเต็มอยู่แล้ว' });
    }

    // ⚡ ATOMIC: use findOneAndUpdate to prevent race condition
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, coinBalance: { $gte: cost } },
      { 
        $inc: { coinBalance: -cost },
        $set: { gas: Math.min(100, ((await User.findById(userId)).gas || 0) + percent) }
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(400).json({ message: `เหรียญไม่พอ (ต้องการ ${cost.toLocaleString()} Coins)` });
    }

    // Create Transaction for Coin deduction
    const tx = new Transaction({
      user: userId,
      type: 'WITHDRAW',
      amount: cost,
      status: 'completed',
      reference: `REFILL_GAS: เติมพลังงาน Gas +${percent}%`,
    });
    await tx.save();

    // Notify user via Socket
    const io = req.app.get('io');
    if (io) {
      io.to(userId.toString()).emit('balance_update', {
        coinBalance: updatedUser.coinBalance,
        gasBalance: updatedUser.gas,
        gas: updatedUser.gas,
        title: 'เติมพลังงานสำเร็จ!',
        message: `คุณได้ใช้ ${cost.toLocaleString()} Coins เพื่อเติม Gas +${percent}%`,
        type: 'topup'
      });
    }

    return res.status(200).json({
      message: 'เติมพลังงาน Gas สำเร็จแล้ว!',
      coinBalance: updatedUser.coinBalance,
      gasBalance: updatedUser.gas,
      gas: updatedUser.gas
    });
  } catch (err) {
    console.error('Refill gas error:', err);
    return res.status(500).json({ message: err.message });
  }
};

// ──────────────────────────────────────────────
// POST /api/wallet/topup-manual (User submits slip)
// ──────────────────────────────────────────────
export const submitManualTopup = async (req, res) => {
  try {
    const { amount, targetType = 'coins' } = req.body;
    const userId = req.user._id || req.user.id;

    // Validate amount
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0 || numAmount > 1000000) {
      return res.status(400).json({ message: 'จำนวนเงินไม่ถูกต้อง (1 - 1,000,000 บาท)' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'กรุณาอัปโหลดรูปภาพสลิป' });
    }

    // Upload slip to GCS
    const slipUrl = await uploadToGCS(req.file);

    const tx = new Transaction({
      user: userId,
      type: 'TOPUP',
      amount: numAmount,
      status: 'pending', // Waiting for Admin to check
      slipUrl: slipUrl,
      targetType: targetType,
      reference: targetType === 'gas' ? 'MANUAL_GAS_DEPOSIT' : 'MANUAL_DEPOSIT',
    });
    await tx.save();

    return res.status(201).json({
      message: 'ส่งหลักฐานสำเร็จ! กรุณารอแอดมินตรวจสอบและเติมเหรียญให้คุณใน 1-3 ชม.',
      transaction: tx
    });
  } catch (err) {
    console.error('Manual topup error:', err);
    return res.status(500).json({ message: err.message });
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

    const thbAmount = numAmount / 10; // 10 Coins = 1 THB (1 Coin = 0.1 THB)
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
        }
      }

      tx.status = status;
      await tx.save({ session });

      if (session) {
        await session.commitTransaction();
        session.endSession();
      }

      const io = req.app.get('io');
      if (io && tx.user) {
        const uId = tx.user._id.toString();
        const updatedUserObj = await User.findById(uId);
        if (updatedUserObj) {
          io.to(uId).emit('balance_update', {
            coinBalance: updatedUserObj.coinBalance,
            title: status === 'completed' ? 'ถอนเงินสำเร็จ!' : 'คำขอถอนเงินถูกปฏิเสธ',
            message: status === 'completed' ? `การถอนเงินจำนวน ฿${tx.amount / 10} ของคุณได้รับการอนุมัติแล้ว และยอดเหรียญถูกหักเรียบร้อย` : 'คำขอถอนเงินของคุณไม่ผ่านการอนุมัติ',
            type: 'withdraw'
          });
        }
      }

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
// GET /api/wallet/admin/topups (Admin)
// ──────────────────────────────────────────────
export const getAdminTopups = async (req, res) => {
  try {
    const topups = await Transaction.find({ type: 'TOPUP' })
      .populate('user', 'name email profileImage coinBalance')
      .sort({ createdAt: -1 });
    return res.json(topups);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ──────────────────────────────────────────────
// PATCH /api/wallet/admin/topups/:id/status (Admin)
// ──────────────────────────────────────────────
export const updateTopupStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'completed' or 'failed'

    if (!['completed', 'failed'].includes(status)) {
      return res.status(400).json({ message: 'สถานะไม่ถูกต้อง' });
    }

    const tx = await Transaction.findById(id).populate('user');
    if (!tx) return res.status(404).json({ message: 'ไม่พบรายการนี้' });
    if (tx.status !== 'pending') {
      return res.status(400).json({ message: 'รายการนี้ถูกจัดการไปแล้ว' });
    }

    if (status === 'completed') {
      const user = await User.findById(tx.user._id);
      if (user) {
        if (tx.targetType === 'gas') {
          // Manual Gas Topup (Amount here is probably percentage if they entered it, but usually it's cost/10)
          // Let's assume for manual gas, amount is the percentage to add
          user.gas = Math.min(100, (user.gas || 0) + tx.amount);
        } else {
          user.coinBalance = (user.coinBalance || 0) + tx.amount;
        }
        await user.save();

        // Create Notification
        await Notification.create({
          recipient: user._id,
          sender: req.user._id,
          type: 'system',
          text: tx.targetType === 'gas' 
            ? `✅ การเติม Gas สำเร็จ! พลังงานของคุณเพิ่มขึ้น +${tx.amount}%` 
            : `✅ การเติมเหรียญสำเร็จ! คุณได้รับ ${tx.amount} Coins เรียบร้อยแล้ว`,
          link: '/dashboard/wallet'
        });

        // Notify user via Socket
        const io = req.app.get('io');
        if (io) {
          io.to(user._id.toString()).emit('balance_update', {
            coinBalance: user.coinBalance,
            gasBalance: user.gas,
            gas: user.gas,
            title: tx.targetType === 'gas' ? 'พลังงานเข้าแล้ว!' : 'เหรียญเข้าแล้ว!',
            message: tx.targetType === 'gas' 
              ? `แอดมินอนุมัติการเติม Gas ของคุณแล้ว: +${tx.amount}%`
              : `แอดมินอนุมัติสลิปของคุณแล้ว: +${tx.amount} Coins`,
            type: 'topup'
          });
          io.to(user._id.toString()).emit('new_notification');
        }
      }
    } else if (status === 'failed') {
      // Create Notification for failure
      await Notification.create({
        recipient: tx.user._id,
        sender: req.user._id,
        type: 'system',
        text: `❌ คำขอเติม${tx.targetType === 'gas' ? ' Gas ' : 'เหรียญ'}ถูกปฏิเสธ กรุณาตรวจสอบความถูกต้องของสลิปหรือติดต่อแอดมิน`,
        link: '/dashboard/wallet'
      });

      const io = req.app.get('io');
      if (io) {
        io.to(tx.user._id.toString()).emit('new_notification');
      }
    }

    tx.status = status;
    await tx.save();

    await AuditLog.create({
      action: 'BALANCE_ADJUSTMENT',
      severity: 'low',
      details: { txId: tx._id, type: 'TOPUP_MANUAL', status, targetUser: tx.user?.email },
      ip: req.ip
    });

    return res.json({ message: `จัดการรายการสำเร็จ (${status})`, transaction: tx });
  } catch (err) {
    console.error('Update topup status error:', err);
    return res.status(500).json({ message: err.message });
  }
};

// ──────────────────────────────────────────────
// POST /api/wallet/refill-gas (User refills Gas)
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

function parseSlipData(slipData) {
  const d = slipData.data || slipData;
  return {
    amount: d.amount?.amount || d.amount || 0,
    transRef: d.transRef || d.referenceNo || d.payload || 'unknown'
  };
}
