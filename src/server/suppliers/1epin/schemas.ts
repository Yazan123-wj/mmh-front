import { z } from "zod";

export const resultCodeSchema = z.union([z.string(), z.number()]).transform((value) => String(value).padStart(2, "0"));

export const balanceResponseSchema = z.object({
  ResultCode: resultCodeSchema,
  ResultMessage: z.string().optional().default(""),
  Balance: z.union([z.number(), z.string()]).optional().default(0),
});

export const categorySchema = z.object({
  CategoryId: z.union([z.number(), z.string()]),
  CategoryName: z.string(),
  CategoryType: z.string().optional().default(""),
  CategoryImage: z.string().optional(),
  CategoryDescription: z.string().optional(),
  CategoryUsage: z.string().optional(),
});

export const categoriesResponseSchema = z.object({
  ResultCode: resultCodeSchema,
  ResultMessage: z.string().optional().default(""),
  Categories: z.array(categorySchema).nullable().optional(),
});

export const categoryDetailResponseSchema = z.object({
  ResultCode: resultCodeSchema,
  ResultMessage: z.string().optional().default(""),
  Category: categorySchema.nullable().optional(),
});

export const productSchema = z.object({
  ProductId: z.union([z.number(), z.string()]),
  ProductName: z.string(),
  ProductPrice: z.union([z.number(), z.string()]).optional(),
  CategoryId: z.union([z.number(), z.string()]).optional(),
  CategoryName: z.string().optional(),
  CategoryType: z.string().optional(),
  StockQuantity: z.union([z.number(), z.string()]).optional(),
});

export const productsResponseSchema = z.object({
  ResultCode: resultCodeSchema,
  ResultMessage: z.string().optional().default(""),
  Products: z.array(productSchema).nullable().optional(),
});

export const addOrderResponseSchema = z.object({
  ResultCode: resultCodeSchema,
  ResultMessage: z.string().optional().default(""),
  Balance: z.union([z.number(), z.string()]).optional(),
});

export const checkOrderResponseSchema = z.object({
  ResultCode: resultCodeSchema,
  ResultMessage: z.string().optional().default(""),
  OrderStatusCode: z.union([z.number(), z.string()]).optional().default(0),
  OrderStatusMessage: z.string().optional().default(""),
  PinCodes: z.array(z.string()).nullable().optional(),
  OrderAmount: z.union([z.number(), z.string()]).optional(),
});

export const callbackSchema = z.object({
  OrderNumber: z.string().min(1).max(80),
  OrderStatusCode: z.union([z.number(), z.string()]),
  OrderStatusMessage: z.string().optional().default(""),
  PinCodes: z.array(z.string()).nullable().optional(),
  OrderAmount: z.union([z.number(), z.string()]).optional(),
});

export type CallbackPayload = z.infer<typeof callbackSchema>;
