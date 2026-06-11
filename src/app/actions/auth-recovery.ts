"use server";

import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import { z } from "zod";
import crypto from "crypto";

const requestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const executeSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function requestPasswordReset(data: { email: string }) {
  try {
    const validatedData = requestSchema.parse(data);
    const email = validatedData.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    const genericResponse = {
      success: true,
      message: "If an account with that email exists, we have sent a password reset link to it.",
    };

    if (!user) {
      return genericResponse;
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiryDate = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry: expiryDate,
      },
    });

    const resetLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${rawToken}`;

    try {
      const resendApiKey = process.env.RESEND_API_KEY;
      const resend = new Resend(resendApiKey);

      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: email,
        subject: "Reset your password",
        html: `
          <div>
            <p>Hello,</p>
            <p>You requested a password reset. Click the link below to reset your password:</p>
            <p><a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #0284c7; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a></p>
            <p>This link will expire in 15 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
          </div>
        `,
      });
    } catch (resendError) {
      console.error("Resend email delivery failure:", resendError);
    }

    return genericResponse;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]?.message || "Invalid input";
      return { success: false, error: firstError };
    }
    const message = error instanceof Error ? error.message : "An error occurred";
    return { success: false, error: message };
  }
}

export async function executePasswordReset(data: unknown) {
  try {
    const validatedData = executeSchema.parse(data);

    const hashedToken = crypto.createHash("sha256").update(validatedData.token).digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return { success: false, error: "Invalid or expired reset token." };
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]?.message || "Invalid input";
      return { success: false, error: firstError };
    }
    const message = error instanceof Error ? error.message : "An error occurred";
    return { success: false, error: message };
  }
}
