export type UserRole = "ADMIN" | "MEMBER";
export type TransactionType = "DEPOSIT" | "WITHDRAWAL" | "INTEREST" | "FEE";
export type CreditStatus = "ACTIVE" | "PAID" | "DEFAULTED";
export type PaymentMethod = "CASH" | "TRANSFER" | "ONLINE" | "OTHER";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  document?: string | null;
  memberSince: Date;
  isActive: boolean;
}

export interface SavingsAccountData {
  id: string;
  balance: number;
  accountNumber: string;
  createdAt: Date;
}

export interface TransactionData {
  id: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  description: string;
  reference?: string | null;
  transactionDate: Date;
}

export interface CreditData {
  id: string;
  principal: number;
  monthlyRate: number;
  termMonths: number;
  monthlyPayment: number;
  totalInterest: number;
  totalToPay: number;
  disbursedAt: Date;
  status: CreditStatus;
  notes?: string | null;
  paidAmount: number;
  remainingBalance: number;
}

export interface AmortizationEntryData {
  id: string;
  period: number;
  paymentAmount: number;
  principalPart: number;
  interestPart: number;
  balance: number;
  dueDate: Date;
}

export interface DashboardData {
  savingsBalance: number;
  accountNumber: string;
  activeCredits: number;
  totalCreditBalance: number;
  nextPayment?: { amount: number; dueDate: Date; creditId: string } | null;
  recentTransactions: TransactionData[];
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  }
}
