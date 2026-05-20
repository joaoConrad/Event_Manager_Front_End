export type RegistrationApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ParticipantModel {
  id?: number;
  name: string;
  email: string;
  phone?: string;
  eventId?: number;
  createdAt?: string;
  isCheckedIn?: boolean;
  checkedInAt?: string;
  approvalStatus?: RegistrationApprovalStatus;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  approvalReason?: string | null;
}
