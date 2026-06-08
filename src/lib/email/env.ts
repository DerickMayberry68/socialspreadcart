export interface ResendMailConfig {
  apiKey: string;
  from: string;
}

export function hasResendMailEnv(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}

export function getResendMailConfig(): ResendMailConfig | null {
  if (!hasResendMailEnv()) {
    return null;
  }

  return {
    apiKey: process.env.RESEND_API_KEY as string,
    from: process.env.RESEND_FROM as string,
  };
}
