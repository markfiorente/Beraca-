import Decimal from "decimal.js";

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

const MONTHLY_RATE = new Decimal("0.01");

export interface AmortizationRow {
  period: number;
  paymentAmount: number;
  interestPart: number;
  principalPart: number;
  balance: number;
  dueDate: Date;
}

export interface LoanSummary {
  monthlyPayment: number;
  totalToPay: number;
  totalInterest: number;
  amortization: AmortizationRow[];
}

export function computeMonthlyPayment(principal: number, termMonths: number): number {
  const P = new Decimal(principal);
  const r = MONTHLY_RATE;
  const n = new Decimal(termMonths);

  // cuota = P * r(1+r)^n / ((1+r)^n - 1)
  const onePlusR = r.plus(1);
  const onePlusRtoN = onePlusR.pow(n);
  const cuota = P.mul(r.mul(onePlusRtoN)).div(onePlusRtoN.minus(1));

  return cuota.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

export function buildAmortizationTable(
  principal: number,
  termMonths: number,
  startDate: Date = new Date()
): AmortizationRow[] {
  const r = MONTHLY_RATE;
  const cuota = new Decimal(computeMonthlyPayment(principal, termMonths));
  let balance = new Decimal(principal);
  const rows: AmortizationRow[] = [];

  for (let i = 1; i <= termMonths; i++) {
    const interest = balance.mul(r).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    let principalPart = cuota.minus(interest).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    // Last period: adjust to clear exact balance
    if (i === termMonths) {
      principalPart = balance;
    }

    const newBalance = balance.minus(principalPart).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    rows.push({
      period: i,
      paymentAmount: interest.plus(principalPart).toDecimalPlaces(2).toNumber(),
      interestPart: interest.toNumber(),
      principalPart: principalPart.toNumber(),
      balance: newBalance.toNumber(),
      dueDate,
    });

    balance = newBalance;
  }

  return rows;
}

export function computeLoanSummary(principal: number, termMonths: number): LoanSummary {
  const amortization = buildAmortizationTable(principal, termMonths);
  const monthlyPayment = computeMonthlyPayment(principal, termMonths);
  const totalToPay = amortization.reduce((sum, row) => sum + row.paymentAmount, 0);
  const totalInterest = parseFloat((totalToPay - principal).toFixed(2));

  return {
    monthlyPayment,
    totalToPay: parseFloat(totalToPay.toFixed(2)),
    totalInterest,
    amortization,
  };
}

export function getPaidAmount(payments: { amount: number | string }[]): number {
  return payments.reduce((sum, p) => sum + parseFloat(String(p.amount)), 0);
}

export function getRemainingBalance(principal: number, payments: { amount: number | string }[]): number {
  const paid = getPaidAmount(payments);
  // Rough remaining: total to pay minus paid
  return Math.max(0, parseFloat(principal.toFixed(2)) - paid);
}
