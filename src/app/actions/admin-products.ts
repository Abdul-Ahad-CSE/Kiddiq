"use server";

import prisma from "@/lib/db";
import { verifySessionAndPermissions } from "@/lib/auth-utils";
import { logAdminAction } from "./audit-log";
import { z } from "zod";

const productSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(100),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric and hyphens only"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  price: z.number().positive("Price must be a positive number"),
  costPrice: z.number().nonnegative("Buy-in cost cannot be negative").default(0),
  discountPrice: z.number().nonnegative("Discount price cannot be negative").nullish(),
  categoryId: z.string().min(1, "Please select a category"),
  ageGroup: z.string().min(1, "Please select an age group"),
  images: z.array(z.string().url("Must be a valid image URL")).min(1, "At least one product image is required"),
  stock: z.number().int("Stock must be an integer").nonnegative("Stock cannot be negative"),
  benefits: z.string().min(2, "Benefits must be at least 2 characters"),
  featured: z.boolean().default(false),
  isPreorder: z.boolean().default(false),
  preorderAdvancePercent: z.number().int().min(1).max(100).default(50),
  preorderETA: z.string().nullish(),
}).refine((data) => {
  if (data.discountPrice !== undefined && data.discountPrice !== null && data.discountPrice !== 0) {
    return data.discountPrice < data.price;
  }
  return true;
}, {
  message: "Discount price must be strictly less than the regular price",
  path: ["discountPrice"],
});

export async function createProduct(data: {
  title: string;
  slug: string;
  description: string;
  price: number;
  costPrice: number;
  discountPrice?: number | null;
  categoryId: string;
  ageGroup: string;
  images: string[];
  stock: number;
  benefits: string;
  featured: boolean;
  isPreorder?: boolean;
  preorderAdvancePercent?: number;
  preorderETA?: string | null;
}) {
  try {
    const session = await verifySessionAndPermissions(["MANAGE_PRODUCTS"]);
    
    // Validate inputs
    const validated = productSchema.parse(data);

    // Check if slug is unique
    const existingSlug = await prisma.product.findUnique({
      where: { slug: validated.slug },
    });
    if (existingSlug) {
      throw new Error(`Product slug "${validated.slug}" already exists`);
    }

    const newProduct = await prisma.product.create({
      data: {
        title: validated.title.trim(),
        slug: validated.slug.trim(),
        description: validated.description.trim(),
        price: validated.price,
        costPrice: validated.costPrice,
        discountPrice: validated.discountPrice,
        categoryId: validated.categoryId,
        ageGroup: validated.ageGroup,
        images: validated.images, // JSON array
        stock: validated.stock,
        benefits: validated.benefits.trim(),
        featured: validated.featured,
        isPreorder: validated.isPreorder,
        preorderAdvancePercent: validated.preorderAdvancePercent,
        preorderETA: validated.preorderETA && validated.preorderETA.trim() ? validated.preorderETA.trim() : null,
      },
    });

    await logAdminAction(
      session.user.email!,
      session.user.role!,
      "CREATE_PRODUCT",
      "Product",
      newProduct.id,
      {
        title: newProduct.title,
        slug: newProduct.slug,
        costPrice: newProduct.costPrice,
        discountPrice: newProduct.discountPrice,
        isPreorder: newProduct.isPreorder,
        preorderAdvancePercent: newProduct.preorderAdvancePercent,
        preorderETA: newProduct.preorderETA,
      }
    );

    return { success: true, product: newProduct };
  } catch (error) {
    const message = error instanceof z.ZodError 
      ? error.issues[0].message 
      : error instanceof Error 
        ? error.message 
        : "Failed to create product";
    return { success: false, error: message };
  }
}

export async function updateProduct(
  id: string,
  data: {
    title: string;
    slug: string;
    description: string;
    price: number;
    costPrice: number;
    discountPrice?: number | null;
    categoryId: string;
    ageGroup: string;
    images: string[];
    stock: number;
    benefits: string;
    featured: boolean;
    isPreorder?: boolean;
    preorderAdvancePercent?: number;
    preorderETA?: string | null;
  }
) {
  try {
    const session = await verifySessionAndPermissions(["MANAGE_PRODUCTS"]);
    
    // Validate inputs
    const validated = productSchema.parse(data);

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id },
    });
    if (!product) {
      throw new Error("Product not found");
    }

    // Check if slug belongs to another product
    if (product.slug !== validated.slug) {
      const existingSlug = await prisma.product.findUnique({
        where: { slug: validated.slug },
      });
      if (existingSlug) {
        throw new Error(`Product slug "${validated.slug}" already exists`);
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        title: validated.title.trim(),
        slug: validated.slug.trim(),
        description: validated.description.trim(),
        price: validated.price,
        costPrice: validated.costPrice,
        discountPrice: validated.discountPrice,
        categoryId: validated.categoryId,
        ageGroup: validated.ageGroup,
        images: validated.images,
        stock: validated.stock,
        benefits: validated.benefits.trim(),
        featured: validated.featured,
        isPreorder: validated.isPreorder,
        preorderAdvancePercent: validated.preorderAdvancePercent,
        preorderETA: validated.preorderETA && validated.preorderETA.trim() ? validated.preorderETA.trim() : null,
      },
    });

    await logAdminAction(
      session.user.email!,
      session.user.role!,
      "UPDATE_PRODUCT",
      "Product",
      id,
      { 
        old: {
          title: product.title,
          slug: product.slug,
          price: product.price,
          stock: product.stock,
          costPrice: product.costPrice,
          discountPrice: product.discountPrice,
          isPreorder: product.isPreorder,
          preorderAdvancePercent: product.preorderAdvancePercent,
          preorderETA: product.preorderETA,
        },
        new: {
          title: updatedProduct.title,
          slug: updatedProduct.slug,
          price: updatedProduct.price,
          stock: updatedProduct.stock,
          costPrice: updatedProduct.costPrice,
          discountPrice: updatedProduct.discountPrice,
          isPreorder: updatedProduct.isPreorder,
          preorderAdvancePercent: updatedProduct.preorderAdvancePercent,
          preorderETA: updatedProduct.preorderETA,
        } 
      }
    );

    return { success: true, product: updatedProduct };
  } catch (error) {
    const message = error instanceof z.ZodError 
      ? error.issues[0].message 
      : error instanceof Error 
        ? error.message 
        : "Failed to update product";
    return { success: false, error: message };
  }
}

export async function deleteProduct(id: string) {
  try {
    const session = await verifySessionAndPermissions(["MANAGE_PRODUCTS"]);

    const product = await prisma.product.findUnique({
      where: { id },
    });
    if (!product) {
      throw new Error("Product not found");
    }

    await prisma.product.delete({
      where: { id },
    });

    await logAdminAction(
      session.user.email!,
      session.user.role!,
      "DELETE_PRODUCT",
      "Product",
      id,
      { title: product.title, slug: product.slug }
    );

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete product";
    return { success: false, error: message };
  }
}
