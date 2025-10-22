export interface Admin {
  user_id: string;
  user_name: string;
  email: string;
  password: string;
  is_super_admin: boolean;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export type SafeAdmin = Omit<Admin, 'password'>;