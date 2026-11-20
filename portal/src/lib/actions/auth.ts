"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn, signOut } from "@/lib/auth";
import { loginSchema, type LoginInput } from "@/lib/auth/schemas";

/**
 * Authentication server actions.
 *
 * Login errors are intentionally generic — the form never learns whether the
 * email or the password was wrong, so user enumeration is not possible.
 */

export interface LoginActionState {
  error?: string;
}

export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const credentials: LoginInput = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = loginSchema.safeParse(credentials);
  if (!parsed.success) {
    // Same message for malformed and wrong credentials: no signal leaks.
    return { error: "Invalid email or password" };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password" };
    }
    throw error; // Unexpected errors must still surface to the server logs.
  }

  // Route the user to the dashboard matching their role.
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
