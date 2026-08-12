import { z } from 'zod';

export const SignupValidationSchema = z.object({
  email: z.string().email('Invalid email address format'),
  name: z.string().min(1, 'Name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const LoginValidationSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

export const RefreshValidationSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const UpdateUserValidationSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
});
