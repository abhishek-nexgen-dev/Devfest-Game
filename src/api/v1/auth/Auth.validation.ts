import { z } from "zod";

export const signUpValidator = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must not exceed 100 characters"),

    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please enter a valid email address")
      .max(255, "Email must not exceed 255 characters"),

    mobile: z
      .string()
      .trim()
      .regex(/^(?:\+91)?[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number"),

    organization: z
      .string()
      .trim()
      .max(150, "Organization must not exceed 150 characters")
      .optional()
      .or(z.literal("")),

    city: z
      .string()
      .trim()
      .max(100, "City must not exceed 100 characters")
      .optional()
      .or(z.literal("")),

    profilePhoto: z
      .string()
      .trim()
      .max(500, "Profile photo path is too long")
      .optional()
      .or(z.literal("")),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must not exceed 128 characters"),

    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type signUp_Type = z.infer<typeof signUpValidator>;

export const loginValidator = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address")
    .max(255, "Email must not exceed 255 characters"),
  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password must not exceed 128 characters"),
});

export type login_Type = z.infer<typeof loginValidator>;

export const changePasswordValidator = z
  .object({
    oldPassword: z.string().optional(),
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must not exceed 128 characters"),
    confirmNewPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => Boolean(data.oldPassword || data.currentPassword), {
    message: "Current password is required",
    path: ["currentPassword"],
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

export type changePassword_Type = z.infer<typeof changePasswordValidator>;

export const AuthValidator = {
  REGISTER_SCHEMA: signUpValidator,
  LOGIN_SCHEMA: loginValidator,
  CHANGE_PASSWORD_SCHEMA: changePasswordValidator,
};

export default AuthValidator;
