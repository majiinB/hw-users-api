export interface Counselor {
  user_id: string;
  user_name: string;
  email: string;
  password: string;
  is_deleted: boolean;
  department_id: number;
  created_at: Date;
  updated_at: Date;
}

export type SafeCounselor = Omit<Counselor, 'password'>;