export type GetMeetingsResponse = {
  meetingId: string;
  attendeeCount: number;
  createdAt: string;
}[];

export type CreateMeetingResponse = {
  success: true;
  meeting: any;
  attendee: any;
};

export type JoinMeetingResponse = CreateMeetingResponse;
