export interface ApiSuccessResponse<T> {
  success?: boolean;
  status?: string;
  data?: T;
  message?: string;
  token?: string;
  user?: AuthUser;
  patient?: PatientProfile;
  files?: MedicalFile[];
  ai_reports?: AiReport[];
  appointments?: Appointment[];
  clientSecret?: string;
  aiStatus?: unknown;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'patient' | 'doctor' | 'admin';
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'patient' | 'doctor' | 'admin';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: AuthUser;
}

export interface PatientProfile {
  _id: string;
  user: string;
  dob?: string;
  gender?: 'male' | 'female' | 'other';
  medical_history?: Record<string, unknown>;
  createdAt?: string;
}

export interface UpdatePatientProfileRequest {
  name?: string;
  phone?: string;
  dob?: string;
  gender?: PatientProfile['gender'];
  medical_history?: Record<string, unknown>;
}

export interface DoctorProfile {
  _id: string;
  userId: string | AuthUser;
  specialty?: string;
  bio?: string;
  licenseNumber?: string;
  yearsOfExperience?: number;
  hospitalInfo?: string;
  isApproved?: boolean;
}

export interface DoctorAvailability {
  _id: string;
  doctorProfileId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isActive?: boolean;
}

export interface Appointment {
  _id: string;
  patientId: string | AuthUser;
  doctorId: string | AuthUser;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type AppointmentStatus =
  | 'scheduled'
  | 'completed'
  | 'cancelled'
  | 'no-show'
  | 'awaiting_payment'
  | 'payment_failed';

export interface MedicalFile {
  _id?: string;
  patient?: string;
  filename?: string;
  originalName?: string;
  originalname?: string;
  mimeType?: string;
  mimetype?: string;
  size?: number;
  path?: string;
  modality?: string;
  part?: string;
  uploadedAt?: string;
}

export interface AiReport {
  _id: string;
  patient: string;
  file?: string | null;
  model_name: string;
  output_json: {
    label?: string;
    prediction?: string | number;
    probabilities?: number[];
    [key: string]: unknown;
  };
  confidence: number;
  explainability_path?: string | null;
  createdAt: string;
}

export interface AiPredictRequest {
  patientId: string;
  features: number[];
  fileId?: string;
  doctorId?: string;
}

export interface BoneFractureResult {
  prediction?: string;
  confidence?: number;
  label?: string;
  [key: string]: unknown;
}

export interface PaymentIntentRequest {
  appointmentId: string;
  amount: number;
  type: 'full_payment' | 'deposit';
}

export interface PaymentIntentResponse {
  status: string;
  clientSecret: string;
}

export interface Payment {
  _id: string;
  transactionId: string;
  userId: string;
  appointmentId: string;
  amount: number;
  currency: string;
  type: 'full_payment' | 'deposit';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod?: string;
  refunds?: Refund[];
  createdAt?: string;
}

export interface Refund {
  refundId: string;
  amount: number;
  status: string;
  reason?: string;
  createdAt: string;
}

export interface RefundRequest {
  paymentId: string;
  amount?: number;
  reason?: string;
}

export interface NotificationPreferences {
  _id?: string;
  userId: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
}

export interface BookAppointmentRequest {
  doctorId: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface UpdateDoctorProfileRequest {
  specialty?: string;
  bio?: string;
  licenseNumber?: string;
  yearsOfExperience?: number;
  hospitalInfo?: string;
}

export interface AddAvailabilityRequest {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export interface ApiError {
  message?: string;
  status?: string;
  errors?: Array<{ msg: string; path?: string }>;
}
