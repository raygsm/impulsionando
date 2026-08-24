export type MeetingKind = "committee" | "mentoring" | "focus_group" | "company_interview" | "school_review" | "project_review";

export type MeetingParticipant = {
  userId: string;
  role: "student" | "teacher" | "professional" | "company" | "committee" | "guardian" | "guest";
  consentToRecording: boolean;
};

export type RevelaMeeting = {
  id: string;
  kind: MeetingKind;
  title: string;
  projectId?: string;
  startsAt: string;
  participants: MeetingParticipant[];
  recording: "off" | "consent_pending" | "enabled";
  transcription: "off" | "enabled";
  status: "scheduled" | "live" | "completed" | "cancelled";
};

export type MeetingMinutes = {
  meetingId: string;
  summary: string;
  decisions: string[];
  divergences: string[];
  actionItems: Array<{ owner: string; task: string; dueAt?: string }>;
  followups: string[];
  generatedAt: string;
  requiresHumanReview: boolean;
};

export const revelaMeetingRules = [
  "Recording and transcription must be visibly disclosed before entry.",
  "Recording starts only when the required consent state is satisfied.",
  "Impulsionito may summarize, identify decisions, divergences and tasks, but minutes remain reviewable by authorized humans.",
  "Meetings involving minors require school and guardian governance when applicable.",
  "Raw recordings, transcripts and minutes have separate access controls and retention rules.",
  "No hidden sentiment scoring or psychological diagnosis is produced from meetings.",
] as const;

export function canStartRecording(meeting: RevelaMeeting) {
  if (meeting.recording !== "enabled") return false;
  return meeting.participants.every((participant) => participant.consentToRecording);
}
