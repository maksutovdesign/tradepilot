import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db";

export const authRouter = Router();

const loginSchema = z.object({ email: z.string().email() });

/**
 * Hackathon-scope auth: looks up (or creates) the company by email domain.
 * No session/JWT layer — the frontend just stores companyId. Replace with
 * real auth before this touches production data.
 */
authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email } = parsed.data;
  let user = await prisma.user.findUnique({
    where: { email },
    include: { company: true },
  });

  if (!user) {
    const company = await prisma.company.create({
      data: { name: email.split("@")[1] ?? "New Company" },
    });
    user = await prisma.user.create({
      data: { email, name: email.split("@")[0], companyId: company.id },
      include: { company: true },
    });
  }

  res.json({ user });
});
