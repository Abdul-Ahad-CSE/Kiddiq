"use server";

import prisma from "@/lib/db";
import { verifySessionAndPermissions } from "@/lib/auth-utils";
import { logAdminAction } from "./audit-log";
import { z } from "zod";

const directSaleSchema = z.object({
  productId: z.string().min(1, "Please select a product"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  price: z.number().nonnegative("Price cannot be negative"),
  date: z.preprocess(
    (val) => (val ? new Date(val as string) : undefined),
    z.date().optional()
  ),
  comment: z.string().optional().nullable(),
});

export async function getDirectSales() {
  try {
    await verifySessionAndPermissions(["MANAGE_ORDERS"]);
    const sales = await prisma.directSale.findMany({
      include: {
        product: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });
    return { success: true, sales };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch sales";
    return { success: false, error: message };
  }
}

export async function createDirectSale(data: {
  productId: string;
  quantity: number;
  price: number;
  date?: string | Date | null;
  comment?: string | null;
}) {
  try {
    const session = await verifySessionAndPermissions(["MANAGE_ORDERS"]);
    const validated = directSaleSchema.parse(data);

    const directSale = await prisma.$transaction(async (tx) => {
      // 1. Fetch product & check stock
      const product = await tx.product.findUnique({
        where: { id: validated.productId },
      });

      if (!product) {
        throw new Error("Product not found");
      }

      if (product.stock < validated.quantity) {
        throw new Error(`Insufficient stock. Available: ${product.stock}, Requested: ${validated.quantity}`);
      }

      // 2. Decrement stock
      await tx.product.update({
        where: { id: validated.productId },
        data: {
          stock: {
            decrement: validated.quantity,
          },
        },
      });

      // 3. Create DirectSale record
      const saleDate = validated.date || new Date();
      const newSale = await tx.directSale.create({
        data: {
          productId: validated.productId,
          quantity: validated.quantity,
          price: validated.price,
          date: saleDate,
          receivedBy: session.user.email!,
          comment: validated.comment || null,
        },
      });

      return newSale;
    });

    // 4. Log admin action
    await logAdminAction(
      session.user.email!,
      session.user.role!,
      "CREATE_DIRECT_SALE",
      "DirectSale",
      directSale.id,
      {
        productId: directSale.productId,
        quantity: directSale.quantity,
        price: directSale.price,
        date: directSale.date,
      }
    );

    return { success: true, directSale };
  } catch (error) {
    const message = error instanceof z.ZodError
      ? error.issues[0].message
      : error instanceof Error
        ? error.message
        : "Failed to create sale";
    return { success: false, error: message };
  }
}

export async function updateDirectSale(
  id: string,
  data: {
    productId: string;
    quantity: number;
    price: number;
    date?: string | Date | null;
    comment?: string | null;
  }
) {
  try {
    const session = await verifySessionAndPermissions(["MANAGE_ORDERS"]);
    const validated = directSaleSchema.parse(data);

    const directSale = await prisma.$transaction(async (tx) => {
      // 1. Fetch existing direct sale record
      const existingSale = await tx.directSale.findUnique({
        where: { id },
      });

      if (!existingSale) {
        throw new Error("Direct sale record not found");
      }

      // 2. Handle stock adjustment based on whether product ID changed or not
      if (existingSale.productId === validated.productId) {
        const delta = validated.quantity - existingSale.quantity;
        if (delta !== 0) {
          const product = await tx.product.findUnique({
            where: { id: validated.productId },
          });

          if (!product) {
            throw new Error("Product not found");
          }

          if (delta > 0 && product.stock < delta) {
            throw new Error(`Insufficient stock. Available: ${product.stock}, Required: ${delta}`);
          }

          await tx.product.update({
            where: { id: validated.productId },
            data: {
              stock: {
                decrement: delta,
              },
            },
          });
        }
      } else {
        // Product ID changed: restore old product stock, decrement new product stock
        // Restore old product stock
        await tx.product.update({
          where: { id: existingSale.productId },
          data: {
            stock: {
              increment: existingSale.quantity,
            },
          },
        });

        // Decrement new product stock
        const newProduct = await tx.product.findUnique({
          where: { id: validated.productId },
        });

        if (!newProduct) {
          throw new Error("New product not found");
        }

        if (newProduct.stock < validated.quantity) {
          throw new Error(`Insufficient stock for new product. Available: ${newProduct.stock}, Requested: ${validated.quantity}`);
        }

        await tx.product.update({
          where: { id: validated.productId },
          data: {
            stock: {
              decrement: validated.quantity,
            },
          },
        });
      }

      // 3. Update the DirectSale record
      const saleDate = validated.date || existingSale.date;
      const updatedSale = await tx.directSale.update({
        where: { id },
        data: {
          productId: validated.productId,
          quantity: validated.quantity,
          price: validated.price,
          date: saleDate,
          comment: validated.comment || null,
        },
      });

      return { existingSale, updatedSale };
    });

    // 4. Log admin action
    await logAdminAction(
      session.user.email!,
      session.user.role!,
      "UPDATE_DIRECT_SALE",
      "DirectSale",
      id,
      {
        old: {
          productId: directSale.existingSale.productId,
          quantity: directSale.existingSale.quantity,
          price: directSale.existingSale.price,
        },
        new: {
          productId: directSale.updatedSale.productId,
          quantity: directSale.updatedSale.quantity,
          price: directSale.updatedSale.price,
        },
      }
    );

    return { success: true, directSale: directSale.updatedSale };
  } catch (error) {
    const message = error instanceof z.ZodError
      ? error.issues[0].message
      : error instanceof Error
        ? error.message
        : "Failed to update sale";
    return { success: false, error: message };
  }
}

export async function deleteDirectSale(id: string) {
  try {
    const session = await verifySessionAndPermissions(["MANAGE_ORDERS"]);

    const deletedSale = await prisma.$transaction(async (tx) => {
      // 1. Fetch the existing DirectSale record
      const existingSale = await tx.directSale.findUnique({
        where: { id },
      });

      if (!existingSale) {
        throw new Error("Direct sale record not found");
      }

      // 2. Restore product stock
      await tx.product.update({
        where: { id: existingSale.productId },
        data: {
          stock: {
            increment: existingSale.quantity,
          },
        },
      });

      // 3. Delete the direct sale record
      await tx.directSale.delete({
        where: { id },
      });

      return existingSale;
    });

    // 4. Log admin action
    await logAdminAction(
      session.user.email!,
      session.user.role!,
      "DELETE_DIRECT_SALE",
      "DirectSale",
      id,
      {
        productId: deletedSale.productId,
        quantity: deletedSale.quantity,
        price: deletedSale.price,
      }
    );

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete sale";
    return { success: false, error: message };
  }
}
