import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export const simulatorSchema = z.object({
  amount: z.number().min(10000, "Monto mínimo $10,000").max(100_000_000, "Monto máximo $100,000,000"),
  termMonths: z.number().int().min(1, "Mínimo 1 mes").max(120, "Máximo 120 meses"),
});

export const paymentSchema = z.object({
  creditId: z.string().min(1, "Selecciona un crédito"),
  amount: z.number().positive("El monto debe ser positivo"),
  method: z.enum(["CASH", "TRANSFER", "ONLINE", "OTHER"]),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export const transactionSchema = z.object({
  accountId: z.string().min(1, "Selecciona una cuenta"),
  type: z.enum(["DEPOSIT", "WITHDRAWAL", "INTEREST", "FEE"]),
  amount: z.number().positive("El monto debe ser positivo"),
  description: z.string().min(1, "Descripción requerida"),
  reference: z.string().optional(),
});

export const creditSchema = z.object({
  userId: z.string().min(1, "Selecciona un miembro"),
  principal: z.number().min(10000, "Monto mínimo $10,000"),
  termMonths: z.number().int().min(1).max(120),
  notes: z.string().optional(),
});

export const memberSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  phone: z.string().optional(),
  document: z.string().optional(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});
