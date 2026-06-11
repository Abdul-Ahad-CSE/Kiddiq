"use server";

import prisma from "@/lib/db";
import { checkoutSchema, CheckoutFormInput } from "@/lib/validation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@/generated/prisma/client";

interface CartItemInput {
  id: string;
  title: string;
  price: number;
  quantity: number;
}

export async function createOrder(
  formData: CheckoutFormInput,
  items: CartItemInput[],
  promoCode?: string | null
) {
  try {
    // 1. Server-side validation using the existing Zod schema
    const validationResult = checkoutSchema.safeParse(formData);
    if (!validationResult.success) {
      return {
        success: false,
        message: "Validation failed: " + validationResult.error.issues.map((issue) => issue.message).join(", "),
      };
    }

    // 2. Cart items validation
    if (!items || items.length === 0) {
      return {
        success: false,
        message: "Validation failed: Your shopping cart is empty.",
      };
    }

    const {
      customerName,
      phone,
      email,
      district,
      area,
      fullAddress,
      paymentOption,
      paymentMethod,
      senderNumber,
      transactionId,
    } = validationResult.data;

    // 3. User authentication lookup
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;

    // 4. Run database operations in an interactive Prisma Transaction
    const createdOrder = await prisma.$transaction(async (tx) => {
      // Check for duplicate transaction ID first
      const existingTransaction = await tx.order.findUnique({
        where: { transactionId },
      });
      if (existingTransaction) {
        throw new Error(`DUPLICATE_TRANSACTION:${transactionId}`);
      }

      // Fetch the latest product details (price and stock) from the database
      const productIds = items.map(item => item.id);
      const dbProducts = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      let calculatedSubtotal = 0;

      // Validate stock levels and compute subtotal using db prices
      for (const item of items) {
        const dbProduct = dbProducts.find(p => p.id === item.id);
        if (!dbProduct) {
          throw new Error(`PRODUCT_NOT_FOUND:${item.title}`);
        }
        if (dbProduct.stock < item.quantity) {
          throw new Error(`INSUFFICIENT_STOCK:${dbProduct.title}:${dbProduct.stock}`);
        }

        calculatedSubtotal += dbProduct.price * item.quantity;
      }

      // Decrement stock for all items
      for (const item of items) {
        await tx.product.update({
          where: { id: item.id },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Fetch seeded Chattogram areas to compute delivery charge server-side
      let calculatedDeliveryCharge = 120; // Default nationwide rate
      if (district === "Chattogram") {
        const dbChattogramAreas = await tx.deliveryArea.findMany({
          where: { district: "Chattogram" },
          select: { name: true },
        });
        const chattogramCityAreas = dbChattogramAreas.map(a => a.name);
        
        if (chattogramCityAreas.includes(area)) {
          calculatedDeliveryCharge = 60;
        }
      }

      // Calculate discount using database coupon lookup
      let serverDiscount = 0;
      let appliedCouponCode: string | null = null;

      if (promoCode) {
        const normalizedPromoCode = promoCode.trim().toUpperCase();
        const coupon = await tx.coupon.findUnique({
          where: { code: normalizedPromoCode },
        });

        if (coupon && coupon.isActive && calculatedSubtotal >= coupon.minOrderAmount) {
          serverDiscount = Math.round(calculatedSubtotal * (coupon.discountPercent / 100));
          appliedCouponCode = coupon.code;
        }
      }

      const serverGrandTotal = Math.max(0, calculatedSubtotal - serverDiscount + calculatedDeliveryCharge);

      // Hybrid split payment calculations
      let serverPaidNow = serverGrandTotal;
      let serverDueOnDelivery = 0;

      if (paymentOption === "cod") {
        serverPaidNow = calculatedDeliveryCharge;
        serverDueOnDelivery = Math.max(0, calculatedSubtotal - serverDiscount);
      }

      // Map cart items into JSON-serializable array
      const serializedItems = items.map(item => ({
        id: item.id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
      }));

      // Create Order
      const newOrder = await tx.order.create({
        data: {
          userId,
          customerName,
          phone,
          email: email || null,
          district,
          area,
          fullAddress,
          items: serializedItems as Prisma.InputJsonValue,
          subtotal: calculatedSubtotal,
          deliveryCharge: calculatedDeliveryCharge,
          couponCode: appliedCouponCode,
          discount: serverDiscount,
          paymentOption: paymentOption === "cod" ? "COD" : "FULL_ADVANCE",
          paymentMethod: paymentMethod === "bkash" ? "bKash" : "Nagad",
          amountPaid: serverPaidNow,
          amountDueOnDelivery: serverDueOnDelivery,
          senderNumber,
          transactionId,
          verificationStatus: "pending",
          orderStatus: "pending_verification",
        },
      });

      return newOrder;
    });

    return {
      success: true,
      orderId: createdOrder.id,
    };
  } catch (error) {
    const err = error as Error;
    console.error("Order submission error:", err);

    // Map specific transaction errors to user-friendly messages
    if (err.message?.startsWith("DUPLICATE_TRANSACTION:")) {
      return {
        success: false,
        message: "This Transaction ID has already been registered. Please check your payment details or contact support.",
      };
    }
    if (err.message?.startsWith("INSUFFICIENT_STOCK:")) {
      const parts = err.message.split(":");
      const title = parts[1] || "Product";
      const stock = parts[2] || "0";
      return {
        success: false,
        message: `Sorry, "${title}" has insufficient stock. Only ${stock} items are available. Please adjust your quantity.`,
      };
    }
    if (err.message?.startsWith("PRODUCT_NOT_FOUND:")) {
      const parts = err.message.split(":");
      const title = parts[1] || "Product";
      return {
        success: false,
        message: `Sorry, the product "${title}" could not be found in our database.`,
      };
    }

    // Map Prisma known constraint errors (P2002 unique constraint failed)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return {
          success: false,
          message: "This Transaction ID has already been registered. Please check your payment details or contact support.",
        };
      }
    }

    return {
      success: false,
      message: "An unexpected error occurred while processing your order. Please try again or contact support.",
    };
  }
}
