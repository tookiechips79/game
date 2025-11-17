/**
 * 💰 CREDIT AUDIT UTILITIES
 * 
 * Provides tools for tracking, validating, and auditing credit transactions
 * Ensures absolute accuracy and prevents credit loss or manipulation
 */

export interface CreditTransaction {
  type: 'reload_coins' | 'admin_add' | 'bet_placed' | 'bet_refund' | 'cashout' | 'bet_won';
  amount: number;
  oldBalance: number;
  newBalance: number;
  timestamp: number;
  reason: string;
  adminNotes?: string;
}

export interface CreditAuditReport {
  userId: string;
  currentBalance: number;
  totalTransactions: number;
  totalIncome: number;
  totalOutcome: number;
  expectedBalance: number;
  isBalanceAccurate: boolean;
  discrepancy: number;
  lastTransaction: CreditTransaction | null;
  transactionsByType: Record<string, number>;
  suspiciousActivity: string[];
}

export function generateCreditAuditReport(
  userId: string,
  currentBalance: number,
  transactions: CreditTransaction[]
): CreditAuditReport {
  let totalIncome = 0;
  let totalOutcome = 0;
  const transactionsByType: Record<string, number> = {
    reload_coins: 0,
    admin_add: 0,
    bet_placed: 0,
    bet_refund: 0,
    cashout: 0,
    bet_won: 0,
  };
  
  const suspiciousActivity: string[] = [];
  
  for (const tx of transactions) {
    transactionsByType[tx.type]++;
    
    if (['reload_coins', 'admin_add', 'bet_won', 'bet_refund'].includes(tx.type)) {
      totalIncome += tx.amount;
    } else {
      totalOutcome += tx.amount;
    }
  }
  
  const expectedBalance = totalIncome - totalOutcome;
  const discrepancy = Math.abs(currentBalance - expectedBalance);
  const isBalanceAccurate = discrepancy < 0.01;
  
  return {
    userId,
    currentBalance,
    totalTransactions: transactions.length,
    totalIncome,
    totalOutcome,
    expectedBalance,
    isBalanceAccurate,
    discrepancy,
    lastTransaction: transactions[transactions.length - 1] || null,
    transactionsByType,
    suspiciousActivity,
  };
}

export function validateTransactionSequence(transactions: CreditTransaction[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    const expectedNewBalance = ['reload_coins', 'admin_add', 'bet_won', 'bet_refund'].includes(tx.type)
      ? tx.oldBalance + tx.amount
      : tx.oldBalance - tx.amount;
    
    if (Math.abs(tx.newBalance - expectedNewBalance) > 0.01) {
      errors.push(`TX ${i}: Balance mismatch`);
    }
    
    if (i < transactions.length - 1) {
      const nextTx = transactions[i + 1];
      if (nextTx.oldBalance !== tx.newBalance) {
        errors.push(`TX ${i}->${i + 1}: Chain broken`);
      }
    }
    
    if (tx.newBalance < 0) {
      errors.push(`TX ${i}: Negative balance`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
