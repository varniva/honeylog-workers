"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { inviteClientContactSchema } from "@/lib/auth/schemas";
import { assertWorkspaceOwner, ForbiddenError } from "@/lib/authorization";

/**
 * Owner-only client contact management.
 *
 * Registration is closed: client accounts exist ONLY when the workspace owner
 * invites them here. The temporary password supplied by the owner is hashed
 * with Argon2id before persistence — plaintext is never stored or logged.
 */
export interface InviteClientActionState {
  error?: string;
  success?: string;
}

const inviteFormSchema = inviteClientContactSchema;

export async function inviteClientContactAction(
  _prevState: InviteClientActionState,
  formData: FormData,
): Promise<InviteClientActionState> {
  // 1. Authorization first: only workspace owners may invite client contacts.
  let session;
  try {
    session = await assertWorkspaceOwner();
  } catch (error) {
    if (error instanceof ForbiddenError) return { error: "Access denied" };
    throw error;
  }
  const workspaceId = session.user.workspaceId as string;

  // 2. Validate the payload with Zod.
  const parsed = inviteFormSchema.safeParse({
    clientName: String(formData.get("clientName") ?? ""),
    email: String(formData.get("email") ?? ""),
    tempPassword: String(formData.get("tempPassword") ?? ""),
  });
  if (!parsed.success) {
    return { error: z.prettifyError(parsed.error) };
  }
  const { clientName, email, tempPassword } = parsed.data;

  // 3. Hash the temporary password BEFORE any database write.
  const passwordHash = await hashPassword(tempPassword);

  try {
    // Idempotent per (workspace, email): re-inviting updates the contact.
    const existing = await prisma.client.findFirst({
      where: { workspaceId, email: { equals: email, mode: "insensitive" } },
      include: { user: true },
    });

    if (existing) {
      await prisma.user.update({
        where: { id: existing.user?.id ?? "" },
        data: { passwordHash, name: clientName },
      });
    } else {
      // Create the client record plus its contact user in one transaction.
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: { email, name: clientName, passwordHash, role: "CLIENT" },
        });
        const client = await tx.client.create({
          data: { name: clientName, email, workspaceId, user: { connect: { id: user.id } } },
        });
        await tx.user.update({ where: { id: user.id }, data: { clientId: client.id, workspaceId } });
      });
    }
  } catch {
    // Generic message: do not leak whether the email is already registered.
    return { error: "Could not create the client contact" };
  }

  revalidatePath("/dashboard/owner");
  return { success: `Invitation created for ${email}. Share the temporary password securely.` };
}
