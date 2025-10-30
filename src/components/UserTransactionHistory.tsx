import React, { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { format } from "date-fns";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  BadgeCheck, 
  BadgeMinus, 
  CreditCard, 
  Receipt, 
  ArrowDown, 
  ArrowUp,
  DollarSign,
  CalendarClock,
  ShieldAlert,
  Wallet
} from "lucide-react";
import { UserBetReceipt, CreditTransaction } from "@/types/user";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Transaction {
  id: string;
  userId: string;
  type: 'subscription' | 'deposit' | 'withdrawal' | 'bet' | 'win' | 'loss' | 'admin_add' | 'admin_deduct' | 'cashout';
  amount: number;
  details: string;
  timestamp: number;
}

interface UserTransactionHistoryProps {
  userId: string;
  transactionType?: 'all' | 'bets' | 'coins';
  isAdmin?: boolean;
}

const UserTransactionHistory: React.FC<UserTransactionHistoryProps> = ({ 
  userId, 
  transactionType = 'all',
  isAdmin = false 
}) => {
  const { userBetReceipts, getUserBetReceipts, getHardLedgerBetReceipts, creditTransactions, getCreditTransactions, getAllUsers, getUserById, getHardLedgerBetHistory } = useUser();
  const [filter, setFilter] = useState<'all' | 'wins' | 'losses' | 'deposits' | 'withdrawals' | 'subscriptions' | 'admin' | 'cashouts'>('all');
  
  // For admin view, get all transactions from all users
  const allUsers = getAllUsers();
  const betReceipts = isAdmin ? userBetReceipts : getUserBetReceipts(userId);
  
  // For user settings, use immutable bet receipts that can never be cleared
  const immutableBetReceipts = isAdmin ? userBetReceipts : getHardLedgerBetReceipts(userId);
  const userCreditTransactions = isAdmin ? creditTransactions : getCreditTransactions(userId);
  
  const generateTransactions = (receipts: UserBetReceipt[]): Transaction[] => {
    const transactions: Transaction[] = [];
    
    // Process bet receipts for wins and losses, skip any admin transactions
    receipts.forEach(receipt => {
      // Skip all transaction types that should be tracked in creditTransactions
      if (receipt.transactionType === 'cashout' || 
          receipt.transactionType === 'admin_add' || 
          receipt.transactionType === 'admin_deduct') {
        return;
      }
      
      const userName = isAdmin ? getUserById(receipt.userId)?.name || receipt.userName || 'User' : '';
      const userPrefix = isAdmin ? `[${userName}] ` : '';
      
      transactions.push({
        id: `bet-${receipt.id}`,
        userId: receipt.userId,
        type: receipt.won ? 'win' : 'loss',
        amount: receipt.amount,
        details: `${userPrefix}${receipt.won ? 'Won' : 'Lost'} bet on ${receipt.teamName} vs ${receipt.opponentName} (Game #${receipt.gameNumber})`,
        timestamp: receipt.timestamp
      });
    });
    
    // Add credit transactions - this is where all admin add/deduct + cashouts are handled
    userCreditTransactions.forEach(tx => {
      const userName = isAdmin ? getUserById(tx.userId)?.name || tx.userName || 'User' : '';
      const userPrefix = isAdmin ? `[${userName}] ` : '';
      
      transactions.push({
        id: tx.id,
        userId: tx.userId,
        type: tx.type,
        amount: tx.amount,
        details: `${userPrefix}${tx.details}`,
        timestamp: tx.timestamp
      });
    });
    
    // Only show real transactions - no sample data
    
    return transactions.sort((a, b) => b.timestamp - a.timestamp);
  };
  
  const transactions = generateTransactions(immutableBetReceipts);
  
  const filteredTransactions = transactions.filter(transaction => {
    if (transactionType === 'bets') {
      if (filter === 'all') return transaction.type === 'win' || transaction.type === 'loss';
      if (filter === 'wins') return transaction.type === 'win';
      if (filter === 'losses') return transaction.type === 'loss';
      return false;
    } else if (transactionType === 'coins') {
      if (filter === 'all') return transaction.type === 'deposit' || transaction.type === 'withdrawal' || 
                                 transaction.type === 'subscription' || transaction.type === 'admin_add' || 
                                 transaction.type === 'admin_deduct' || transaction.type === 'cashout';
      if (filter === 'deposits') return transaction.type === 'deposit';
      if (filter === 'withdrawals') return transaction.type === 'withdrawal';
      if (filter === 'cashouts') return transaction.type === 'cashout';
      if (filter === 'subscriptions') return transaction.type === 'subscription';
      if (filter === 'admin') return transaction.type === 'admin_add' || transaction.type === 'admin_deduct';
      return false;
    }
    
    if (filter === 'all') return true;
    if (filter === 'wins') return transaction.type === 'win';
    if (filter === 'losses') return transaction.type === 'loss';
    if (filter === 'deposits') return transaction.type === 'deposit';
    if (filter === 'withdrawals') return transaction.type === 'withdrawal';
    if (filter === 'cashouts') return transaction.type === 'cashout';
    if (filter === 'subscriptions') return transaction.type === 'subscription';
    if (filter === 'admin') return transaction.type === 'admin_add' || transaction.type === 'admin_deduct';
    
    return true;
  });
  
  const getFilterOptions = () => {
    if (transactionType === 'bets') {
      return (
        <>
          <SelectItem value="all">All Bets</SelectItem>
          <SelectItem value="wins">Wins Only</SelectItem>
          <SelectItem value="losses">Losses Only</SelectItem>
        </>
      );
    } else if (transactionType === 'coins') {
      return (
        <>
          <SelectItem value="all">All Transactions</SelectItem>
          <SelectItem value="deposits">Deposits Only</SelectItem>
          <SelectItem value="withdrawals">Withdrawals Only</SelectItem>
          <SelectItem value="cashouts">Cashouts Only</SelectItem>
          <SelectItem value="subscriptions">Subscription Payments</SelectItem>
          <SelectItem value="admin">Admin Adjustments</SelectItem>
        </>
      );
    }
    
    return (
      <>
        <SelectItem value="all">All Activity</SelectItem>
        <SelectItem value="wins">Wins</SelectItem>
        <SelectItem value="losses">Losses</SelectItem>
        <SelectItem value="deposits">Deposits</SelectItem>
        <SelectItem value="withdrawals">Withdrawals</SelectItem>
        <SelectItem value="cashouts">Cashouts</SelectItem>
        <SelectItem value="subscriptions">Subscriptions</SelectItem>
        <SelectItem value="admin">Admin Adjustments</SelectItem>
      </>
    );
  };
  
  const getTransactionIcon = (type: string) => {
    if (type === 'win') {
      return <BadgeCheck className="h-5 w-5" style={{ color: '#00FF00' }} />;
    }
    if (type === 'loss') {
      return <BadgeMinus className="h-5 w-5" style={{ color: '#FF0000' }} />;
    }
    
    if (type === 'cashout') {
      return <CreditCard className="h-5 w-5 text-blue-500" />;
    }
    if (type === 'admin_deduct') {
      return <ShieldAlert className="h-5 w-5" style={{ color: '#FF0000' }} />;
    }
    if (type === 'admin_add') {
      return <ShieldAlert className="h-5 w-5" style={{ color: '#00FF00' }} />;
    }
    return <Receipt className="h-5 w-5" style={{ color: '#95deff' }} />;
  };
  
  const getTransactionColor = (type: string) => {
    if (type === 'win') {
      return "font-bold";
    }
    if (type === 'loss') {
      return "font-bold";
    }
    if (type === 'admin_deduct') {
      return "text-red-500";
    }
    if (type === 'admin_add') {
      return "text-green-500";
    }
    return "text-gray-400";
  };
  
  const getAmountColor = (type: string) => {
    if (type === 'win') {
      return '#00FF00';
    }
    if (type === 'loss') {
      return '#FF0000';
    }
    return undefined;
  };
  
  const getTransactionName = (type: string) => {
    switch (type) {
      case 'admin_add':
        return "Admin Add";
      case 'admin_deduct':
        return "Admin Deduct";
      case 'cashout':
        return "Cashout";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5" style={{ color: '#95deff' }} />
          <span style={{ color: '#95deff' }}>
            Showing {filteredTransactions.length} {filteredTransactions.length === 1 ? 'record' : 'records'}
          </span>
        </div>
        
        <Select
          value={filter}
          onValueChange={(value) => setFilter(value as any)}
        >
          <SelectTrigger className="w-[200px] border-2" style={{ backgroundColor: '#052240', borderColor: '#95deff' }}>
            <SelectValue placeholder="Filter transactions" />
          </SelectTrigger>
          <SelectContent className="border-2" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
            {getFilterOptions()}
          </SelectContent>
        </Select>
      </div>
      
      {filteredTransactions.length > 0 ? (
        <Card className="border-2 overflow-hidden" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader style={{ backgroundColor: '#052240' }}>
                <TableRow style={{ borderColor: '#95deff' }}>
                  <TableHead className="w-[100px] text-white">Type</TableHead>
                  {isAdmin && <TableHead className="w-[120px] text-white">User</TableHead>}
                  <TableHead className="text-white">Details</TableHead>
                  <TableHead className="text-right text-white">Amount</TableHead>
                  <TableHead className="text-right text-white">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id} className="hover:opacity-80" style={{ backgroundColor: '#004b6b' }}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(transaction.type)}
                        <span className={getTransactionColor(transaction.type)}>
                          {getTransactionName(transaction.type)}
                        </span>
                      </div>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="font-medium" style={{ color: '#95deff' }}>
                        {getUserById(transaction.userId)?.name || transaction.userName || 'User'}
                      </TableCell>
                    )}
                    <TableCell className="text-white">{transaction.details}</TableCell>
                    <TableCell className={`text-right font-bold`} style={{ color: getAmountColor(transaction.type) || 'white' }}>
                      {['deposit', 'win', 'admin_add'].includes(transaction.type) ? '+' : ''}
                      {['withdrawal', 'loss', 'subscription', 'admin_deduct', 'cashout'].includes(transaction.type) ? '-' : ''}
                      {transaction.amount} 
                      {['subscription', 'withdrawal'].includes(transaction.type) ? '$' : ' COINS'}
                    </TableCell>
                    <TableCell className="text-right" style={{ color: '#95deff' }}>
                      {format(new Date(transaction.timestamp), "MMM d, yyyy h:mm a")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
          <Receipt className="h-12 w-12 mx-auto mb-4 opacity-30" style={{ color: '#95deff' }} />
          <p className="text-lg" style={{ color: '#95deff' }}>No transaction history found</p>
          <p className="text-sm mt-2 text-white">Transaction history will appear here as you place bets and make purchases.</p>
        </div>
      )}
    </div>
  );
};

export default UserTransactionHistory;
