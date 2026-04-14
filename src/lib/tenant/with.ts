import { getCurrentTenant } from "./current";

export async function withCurrentTenant<TArgs extends unknown[], TResult>(
  fn: (tenantId: string, ...args: TArgs) => Promise<TResult>,
  ...args: TArgs
): Promise<TResult> {
  const tenant = await getCurrentTenant();
  return fn(tenant.id, ...args);
}
