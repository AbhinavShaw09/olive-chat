import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { HTTP_METHODS } from "@/lib/api/types";
import { AUTH_MODE, AuthMode } from "@/features/auth/lib/types";

export async function authenticateApi<T>(
  mode: AuthMode,
  email: string,
  password: string,
  name?: string
): Promise<T> {
  const endpoint = mode === AUTH_MODE.LOGIN ? API_ENDPOINTS.AUTH.LOGIN : API_ENDPOINTS.AUTH.SIGNUP;
  return apiClient<T>(endpoint, {
    method: HTTP_METHODS.POST,
    body: JSON.stringify(
      mode === AUTH_MODE.LOGIN
        ? { email, password }
        : {
          email,
          password,
          name: name || email.split("@")[0],
        }
    ),
  }
  );
}
