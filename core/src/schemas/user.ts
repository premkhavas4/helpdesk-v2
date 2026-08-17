import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().refine((val) => val.trim() === "" || val.trim().length >= 3, {
    message: "Name must be at least 3 characters long.",
  }),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
  role: z.string(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().refine((val) => val.trim() === "" || val.trim().length >= 3, {
    message: "Name must be at least 3 characters long.",
  }),
  email: z.string().email("Invalid email address."),
  password: z.string().refine((val) => !val || val.length >= 6, {
    message: "Password must be at least 6 characters long if provided.",
  }),
  role: z.string(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
