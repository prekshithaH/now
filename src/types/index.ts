export interface User {
  id: string;
  email: string;
  name: string;
  role: 'patient' | 'doctor';
  avatar?: string;
  profileCompleted?: boolean;
}

export interface Patient extends User {
  role: 'patient';
  dueDate?: string;
  doctorId: string;
  doctorName: string;
  emergencyContacts?: EmergencyContact[];
  currentWeek?: number;
  bloodType?: string;
  allergies?: string;
  medications?: string;
  doctorName?: string;
  hospitalName?: string;
  healthRecords?: HealthRecord[];
  profileCompleted: boolean;
}

export interface Doctor extends User {
  role: 'doctor';
  specialization: string;
  license: string;
  patients: string[];
  profileCompleted: boolean;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export interface HealthRecord {
  id: string;
  patientId: string;
  date: string;
  type: 'blood_pressure' | 'sugar_level' | 'baby_movement' | 'weekly_update';
  data: any;
}

export interface BloodPressureData {
  systolic: number;
  diastolic: number;
  heartRate: number;
  notes?: string;
}

export interface SugarLevelData {
  level: number;
  testType: 'fasting' | 'random' | 'post_meal';
  notes?: string;
}

export interface BabyMovementData {
  count: number;
  duration: number;
  notes?: string;
}

export interface WeeklyUpdateData {
  weight: number;
  symptoms: string[];
  mood: number;
  notes?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  type: 'text' | 'alert' | 'suggestion';
}