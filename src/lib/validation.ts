import { z } from "zod";

export const checkoutSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .regex(/^(?:\+88|88)?(01[3-9]\d{8})$/, "Please enter a valid Bangladeshi mobile number"),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  district: z.string().min(1, "Please select a district"),
  area: z.string().min(1, "Please select or type an area"),
  fullAddress: z.string().min(5, "Address must be at least 5 characters"),
  paymentOption: z.enum(["cod", "full"], {
    message: "Please select a payment option",
  }),
  paymentMethod: z.enum(["bkash", "nagad"], {
    message: "Please select a payment method",
  }),
  senderNumber: z
    .string()
    .regex(/^(?:\+88|88)?(01[3-9]\d{8})$/, "Please enter a valid Bangladeshi mobile number"),
  transactionId: z
    .string()
    .regex(/^[a-zA-Z0-9]{8,15}$/, "Transaction ID must be 8 to 15 alphanumeric characters"),
  saveAddress: z.boolean().optional(),
});

export type CheckoutFormInput = z.infer<typeof checkoutSchema>;
