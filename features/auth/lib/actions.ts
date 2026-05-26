import { authenticateApi } from "./auth";
import { AuthMode } from "@/features/auth/lib/types";
import { UserData } from "@/lib/chat";

export async function authenticateAction(
  mode: AuthMode,
  email: string,
  password: string,
  name?: string
): Promise<{ user: UserData }> {
  return authenticateApi<{ user: UserData }>(
    mode,
    email,
    password,
    name
  );
}
