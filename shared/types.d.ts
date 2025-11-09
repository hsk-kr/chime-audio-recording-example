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

export type WebsocketPacket =
  | {
      type: "connect";
      meetingId: string;
    }
  | {
      type: "connected";
      data: {
        meeting: any;
        attendee: any;
      };
    }
  | {
      type: "attendeesCnt";
      data: {
        cnt: number;
      };
    };

export type JoinMeetingResponse = CreateMeetingResponse;
