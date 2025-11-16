export type GetRoomsResponse = {
  rooms: {
    meetingId: string;
    attendeeCnt: number;
  }[];
};

export type GetPastRoomsResponse = {
  rooms: {
    meetingId: string;
    audioUrl: string | null;
    createdAt: string;
  }[];
};

export type CreateRoomResponse = {
  meeting: any;
};

export type WebsocketPacket =
  | {
      type: "connect";
      data: {
        meetingId: string;
      };
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
