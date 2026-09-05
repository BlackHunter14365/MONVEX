/**
 * [M] MODEL: User Identity, Authentication & Profile
 */

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  currency?: string;
  is_verified?: boolean;
  avatar_url?: string;
  created_at?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  user?: UserProfile;
}

export interface LoginPayload {
  username?: string;
  email?: string;
  password?: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password?: string;
  first_name?: string;
  last_name?: string;
}
