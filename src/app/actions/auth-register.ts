"use server";

import prisma from "@/lib/db";
import { Role } from "@/generated/prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function registerCustomer(data: unknown) {
  try {
    const validatedData = registerSchema.parse(data);

    // Check if email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase().trim() },
    });

    if (existingUser) {
      return { success: false, error: "Email is already registered" };
    }

    // Hash the password (salt rounds 10)
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Create user in the database
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email.toLowerCase().trim(),
        password: hashedPassword,
        role: Role.CUSTOMER,
        permissions: [],
        isActive: true,
      },
    });

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]?.message || "Invalid input";
      return { success: false, error: firstError };
    }
    const message = error instanceof Error ? error.message : "Registration failed";
    return { success: false, error: message };
  }
}
