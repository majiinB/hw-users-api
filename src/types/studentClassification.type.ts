/**
 * Enum representing the classification levels of student performance and well-being.
 * 
 * @remarks
 * This enum is used to categorize students based on their academic performance 
 * and overall wellness status within the Heron WellNest system.
 * 
 * @enum {string}
 */
export enum ClassificationEnum {
  EXCELLING = 'Excelling',
  THRIVING = 'Thriving',
  STRUGGLING = 'Struggling',
  INCRISIS = 'InCrisis'
}

/**
 * Represents a student's classification record with associated user and department information.
 * 
 * @interface StudentClassification
 * @property {string} classification_id - Unique identifier for the classification record
 * @property {string} student_id - Unique identifier for the student
 * @property {ClassificationEnum} classification - The classification category assigned to the student
 * @property {boolean} is_flagged - Indicates whether this classification has been flagged for review
 * @property {Date} classified_at - Timestamp when the classification was assigned
 * @property {string} user_name - Name of the user associated with this classification
 * @property {string} email - Email address of the user
 * @property {number} department_id - Unique identifier for the department
 * @property {string} department_name - Name of the department
 */
export interface StudentClassification {
  classification_id: string;
  student_id: string;
  classification: ClassificationEnum;
  is_flagged: boolean;
  classified_at: Date;
  email: string;
  department_id: number;
  program_name: string;
  department_name: string;
  mood_check_ins?: MoodCheckIn[];
}

export interface MoodCheckIn {
  check_in_id: string;
  mood_1: string;
  mood_2: string;
  mood_3: string;
  checked_in_at: Date;
}