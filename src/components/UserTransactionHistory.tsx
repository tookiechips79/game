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
  const { userBetReceipts, getUserBetReceipts, creditTransactions, getCreditTransactions, getAllUsers, getUserById } = useUser();
  const [filter, setFilter] = useState<'all' | 'wins' | 'losses' | 'deposits' | 'withdrawals' | 'subscriptions' | 'admin' | 'cashouts'>('all');
  
  // For admin view, get all transactions from all users
  const allUsers = getAllUsers();
  const betReceipts = isAdmin ? userBetReceipts : getUserBetReceipts(userId);
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
      
      const userName = isAdmin ? getUserById(receipt.userId)?.name || 'Unknown' : '';
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
      const userName = isAdmin ? getUserById(tx.userId)?.name || 'Unknown' : '';
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
  
  const transactions = generateTransactions(betReceipts);
  
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
    switch (type) {
      case 'win':
        return <BadgeCheck className="h-5 w-5 text-green-500" />;
      case 'loss':
        return <BadgeMinus className="h-5 w-5 text-red-500" />;
      case 'deposit':
        return <ArrowDown className="h-5 w-5 text-[#a3e635]" />;
      case 'withdrawal':
        return <ArrowUp className="h-5 w-5 text-orange-500" />;
      case 'cashout':
        return <Wallet className="h-5 w-5 text-[#F97316]" />;
      case 'subscription':
        return <CreditCard className="h-5 w-5 text-blue-500" />;
      case 'admin_add':
        return <ShieldAlert className="h-5 w-5 text-purple-500" />;
      case 'admin_deduct':
        return <ShieldAlert className="h-5 w-5 text-red-500" />;
      default:
        return <Receipt className="h-5 w-5 text-gray-500" />;
    }
  };
  
  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'win':
        return "text-green-500";
      case 'loss':
        return "text-red-500";
      case 'deposit':
        return "text-[#a3e635]";
      case 'withdrawal':
        return "text-orange-500";
      case 'cashout':
        return "text-[#F97316]";
      case 'subscription':
        return "text-blue-500";
      case 'admin_add':
        return "text-purple-500";
      case 'admin_deduct':
        return "text-red-500";
      default:
        return "text-white";
    }
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
          <CalendarClock className="h-5 w-5 text-gray-400" />
          <span className="text-gray-400">
            Showing {filteredTransactions.length} {filteredTransactions.length === 1 ? 'record' : 'records'}
          </span>
        </div>
        
        <Select
          value={filter}
          onValueChange={(value) => setFilter(value as any)}
        >
          <SelectTrigger className="w-[200px] bg-gray-700 border-gray-600">
            <SelectValue placeholder="Filter transactions" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            {getFilterOptions()}
          </SelectContent>
        </Select>
      </div>
      
      {filteredTransactions.length > 0 ? (
        <Card className="border-gray-700 bg-gray-800/50 overflow-hidden">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader className="bg-gray-800">
                <TableRow>
                  <TableHead className="w-[100px]">Type</TableHead>
                  {isAdmin && <TableHead className="w-[120px]">User</TableHead>}
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id} className="hover:bg-gray-800">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(transaction.type)}
                        <span className={getTransactionColor(transaction.type)}>
                          {getTransactionName(transaction.type)}
                        </span>
                      </div>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="font-medium text-blue-400">
                        {getUserById(transaction.userId)?.name || 'Unknown'}
                      </TableCell>
                    )}
                    <TableCell>{transaction.details}</TableCell>
                    <TableCell className={`text-right ${getTransactionColor(transaction.type)}`}>
                      {['deposit', 'win', 'admin_add'].includes(transaction.type) ? '+' : ''}
                      {['withdrawal', 'loss', 'subscription', 'admin_deduct', 'cashout'].includes(transaction.type) ? '-' : ''}
                      {transaction.amount} 
                      {['subscription', 'withdrawal'].includes(transaction.type) ? '$' : ' COINS'}
                    </TableCell>
                    <TableCell className="text-right text-gray-400">
                      {format(new Date(transaction.timestamp), "MMM d, yyyy h:mm a")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
      ) : (
        <div className="text-center py-12 text-gray-400 border border-dashed border-gray-700 rounded-lg">
          <Receipt className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg">No transaction history found</p>
          <p className="text-sm mt-2">Transaction history will appear here as you place bets and make purchases.</p>
        </div>
      )}
    </div>
  );
};

export default UserTransactionHistory;
