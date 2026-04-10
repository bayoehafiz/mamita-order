"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function submitPin(pin: string) {
  const expectedPin = (process.env.ADMIN_PIN || "").trim();
  
  if (!expectedPin) {
    return { success: false, error: "System error: ADMIN_PIN belum disetting di environment variables." };
  }

  if (pin === expectedPin) {
    (await cookies()).set("admin_session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });
    return { success: true };
  }

  return { success: false, error: "PIN yang kamu masukkan salah." };
}
