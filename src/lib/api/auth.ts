import { apiClient } from "./client";

export interface AuthUser {
  id: string;
  tippalId: string;
  email: string;
  firstName: string;
  lastName: string;
  hospitalityRole: string;
  digitalRole: string;
  communityRole: string;
  flexRole: string;
}

export interface SendOtpResponse {
  message: string;
}

export interface VerifyOtpResponse {
  accessToken: string;
  user: AuthUser;
}

export async function sendOtp(email: string): Promise<SendOtpResponse> {
  const { data } = await apiClient.post<SendOtpResponse>("/auth/otp-send", {
    email,
  });

  return data;
}

export async function verifyOtp(
  email: string,
  code: string,
): Promise<VerifyOtpResponse> {
  const { data } = await apiClient.post<VerifyOtpResponse>(
    "/auth/verify-otp",
    { email, code },
  );

  return data;
}
