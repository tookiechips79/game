import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  generateCreditAuditReport,
  validateTransactionSequence,
  CreditTransaction,
  CreditAuditReport,
} from '@/utils/creditAudit';

export const CreditAuditDashboard: React.FC = () => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedReport, setSelectedReport] = useState<CreditAuditReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const loadUserAudit = async (userId: string) => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const balanceResponse = await fetch(`/api/credits/${userId}`);
      const balanceData = await balanceResponse.json();
      
      const historyResponse = await fetch(`/api/credits/${userId}/history`);
      const historyData = await historyResponse.json();
      
      const report = generateCreditAuditReport(userId, balanceData.balance, historyData.transactions);
      setSelectedReport(report);
      
      const validation = validateTransactionSequence(historyData.transactions);
      setValidationErrors(validation.errors);
    } catch (error) {
      console.error('Failed to load audit:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 p-6">
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-yellow-500/20">
        <CardHeader>
          <CardTitle className="text-yellow-400">💰 Credit Audit Dashboard</CardTitle>
        </CardHeader>
      </Card>

      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-200">Select User</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter User ID"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="bg-slate-800 border-slate-600 text-white"
            />
            <Button
              onClick={() => loadUserAudit(selectedUserId)}
              disabled={!selectedUserId || loading}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {loading ? 'Loading...' : 'View Audit'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedReport && (
        <>
          <Card
            className={`border-l-4 ${
              selectedReport.isBalanceAccurate
                ? 'bg-green-950 border-l-green-500'
                : 'bg-red-950 border-l-red-500'
            }`}
          >
            <CardHeader>
              <CardTitle className={selectedReport.isBalanceAccurate ? 'text-green-400' : 'text-red-400'}>
                {selectedReport.isBalanceAccurate ? '✅ Balance Accurate' : '❌ Discrepancy Detected'}
              </CardTitle>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400">Current Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">{selectedReport.currentBalance}</div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400">Expected Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-400">{selectedReport.expectedBalance}</div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400">Total Income</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">+{selectedReport.totalIncome}</div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400">Total Outcome</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">-{selectedReport.totalOutcome}</div>
              </CardContent>
            </Card>
          </div>

          {validationErrors.length > 0 && (
            <Card className="bg-red-950 border-red-500/50">
              <CardHeader>
                <CardTitle className="text-red-400">🔴 Validation Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {validationErrors.map((error, i) => (
                    <li key={i} className="text-red-300 text-sm font-mono">
                      • {error}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
