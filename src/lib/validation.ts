import { z } from "zod";

export const CATEGORIES = [
  "phones", "wallets", "ids", "bags", "keys", "jewelry",
  "electronics", "documents", "clothing", "pets", "school_items", "other",
] as const;

export const CATEGORY_LABELS: Record<(typeof CATEGORIES)[number], string> = {
  phones: "Phones",
  wallets: "Wallets",
  ids: "IDs",
  bags: "Bags",
  keys: "Keys",
  jewelry: "Jewelry",
  electronics: "Electronics",
  documents: "Documents",
  clothing: "Clothing",
  pets: "Pets",
  school_items: "School Items",
  other: "Other",
};

export const registerSchema = z
  .object({
    firstName: z.string().min(1, "First name is required").max(60),
    lastName: z.string().min(1, "Last name is required").max(60),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30)
      .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, and underscores only"),
    email: z.string().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Include at least one uppercase letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

const baseItemFields = {
  title: z.string().min(3, "Title must be at least 3 characters").max(120),
  category: z.enum(CATEGORIES),
  description: z.string().min(10, "Add a bit more detail (10+ characters)").max(2000),
  distinguishingFeatures: z.string().max(1000).optional(),
  city: z.string().min(1, "City is required"),
  province: z.string().min(1, "Province is required"),
  approximateLocation: z.string().max(200).optional(),
};

export const lostItemSchema = z.object({
  ...baseItemFields,
  dateLost: z.string().refine((d) => !Number.isNaN(Date.parse(d)), "Enter a valid date"),
  rewardAmount: z.coerce.number().int().nonnegative().optional(),
});

export type LostItemInput = z.infer<typeof lostItemSchema>;

export const foundItemSchema = z.object({
  ...baseItemFields,
  dateFound: z.string().refine((d) => !Number.isNaN(Date.parse(d)), "Enter a valid date"),
  currentHoldingInfo: z.string().max(500).optional(),
});

export type FoundItemInput = z.infer<typeof foundItemSchema>;
