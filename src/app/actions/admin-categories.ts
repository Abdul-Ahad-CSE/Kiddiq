"use server";

// Force Turbopack rebuild for updated schema types
import prisma from "@/lib/db";
import { verifySessionAndPermissions } from "@/lib/auth-utils";
import { logAdminAction } from "./audit-log";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric and hyphens only"),
  image: z.string().min(1, "Image is required"),
  text: z.string().max(500, "Description must be 500 characters or less").default(""),
});

export async function createCategory(data: {
  name: string;
  slug: string;
  image: string;
  text: string;
}) {
  try {
    const session = await verifySessionAndPermissions(["MANAGE_CATEGORIES"]);
    
    // Validate inputs
    const validated = categorySchema.parse(data);

    // Check if name or slug already exists
    const existingName = await prisma.category.findUnique({
      where: { name: validated.name },
    });
    if (existingName) {
      throw new Error(`Category name "${validated.name}" already exists`);
    }

    const existingSlug = await prisma.category.findUnique({
      where: { slug: validated.slug },
    });
    if (existingSlug) {
      throw new Error(`Category slug "${validated.slug}" already exists`);
    }

    const newCategory = await prisma.category.create({
      data: {
        name: validated.name.trim(),
        slug: validated.slug.trim(),
        image: validated.image,
        text: validated.text.trim(),
      },
    });

    await logAdminAction(
      session.user.email!,
      session.user.role!,
      "CREATE_CATEGORY",
      "Category",
      newCategory.id,
      { name: newCategory.name, slug: newCategory.slug }
    );

    return { success: true, category: newCategory };
  } catch (error) {
    const message = error instanceof z.ZodError 
      ? error.issues[0].message 
      : error instanceof Error 
        ? error.message 
        : "Failed to create category";
    return { success: false, error: message };
  }
}

export async function updateCategory(
  id: string,
  data: {
    name: string;
    slug: string;
    image: string;
    text: string;
  }
) {
  try {
    const session = await verifySessionAndPermissions(["MANAGE_CATEGORIES"]);
    
    // Validate inputs
    const validated = categorySchema.parse(data);

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id },
    });
    if (!category) {
      throw new Error("Category not found");
    }

    // Check if name or slug belongs to another category
    if (category.name !== validated.name) {
      const existingName = await prisma.category.findUnique({
        where: { name: validated.name },
      });
      if (existingName) {
        throw new Error(`Category name "${validated.name}" already exists`);
      }
    }

    if (category.slug !== validated.slug) {
      const existingSlug = await prisma.category.findUnique({
        where: { slug: validated.slug },
      });
      if (existingSlug) {
        throw new Error(`Category slug "${validated.slug}" already exists`);
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: validated.name.trim(),
        slug: validated.slug.trim(),
        image: validated.image,
        text: validated.text.trim(),
      },
    });

    await logAdminAction(
      session.user.email!,
      session.user.role!,
      "UPDATE_CATEGORY",
      "Category",
      id,
      { 
        old: { name: category.name, slug: category.slug, image: category.image, text: category.text },
        new: { name: updatedCategory.name, slug: updatedCategory.slug, image: updatedCategory.image, text: updatedCategory.text } 
      }
    );

    return { success: true, category: updatedCategory };
  } catch (error) {
    const message = error instanceof z.ZodError 
      ? error.issues[0].message 
      : error instanceof Error 
        ? error.message 
        : "Failed to update category";
    return { success: false, error: message };
  }
}

export async function deleteCategory(id: string) {
  try {
    const session = await verifySessionAndPermissions(["MANAGE_CATEGORIES"]);

    const category = await prisma.category.findUnique({
      where: { id },
    });
    if (!category) {
      throw new Error("Category not found");
    }

    // Safety Guard Check: Count active products under this category
    const productCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      throw new Error(
        `Cannot delete category: ${productCount} active products are attached. Please reassign or delete these products first.`
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    await logAdminAction(
      session.user.email!,
      session.user.role!,
      "DELETE_CATEGORY",
      "Category",
      id,
      { name: category.name, slug: category.slug }
    );

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete category";
    return { success: false, error: message };
  }
}
