import { v4 as uuidv4 } from "uuid";
import ws from "ws";
import {
  ChimeSDKMediaPipelines,
  CreateMediaCapturePipelineCommand,
  CreateMediaConcatenationPipelineCommand,
  DeleteMediaCapturePipelineCommand,
} from "@aws-sdk/client-chime-sdk-media-pipelines";
import {
  ChimeSDKMeetingsClient,
  CreateAttendeeCommand,
  CreateAttendeeCommandOutput,
  CreateMeetingCommand,
  DeleteAttendeeCommand,
  DeleteMeetingCommand,
  GetMeetingCommand,
  ListAttendeesCommand,
} from "@aws-sdk/client-chime-sdk-meetings";

const accessKeyId = process.env.AWS_ACCESS_KEY!;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY!;
const region = process.env.AWS_MEDIA_REGION!;
const bucketName = process.env.AWS_S3_BUCKET_NAME!;

type Meeting = {
  meetingId: string;
  pipelineId: string;
  attendees: { attendee: CreateAttendeeCommandOutput; ws: ws }[];
  createdAt: Date;
};

export const meetings = new Map<string, Meeting>();

const pastMeetings = new Map<string, Meeting>();

export const connectionInfo = {
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
};

const mediaClient = new ChimeSDKMediaPipelines(connectionInfo);

const meetingClient = new ChimeSDKMeetingsClient(connectionInfo);

export async function getMeetings() {
  return {
    meetings,
  };
}

export async function createMeeting() {
  const meeting = await meetingClient.send(
    new CreateMeetingCommand({
      ExternalMeetingId: uuidv4(),
      MediaRegion: region,
    }),
  );

  const meetingId = meeting.Meeting!.MeetingId!;

  const pipeline = await mediaClient.send(
    new CreateMediaCapturePipelineCommand({
      SourceType: "ChimeSdkMeeting",
      SourceArn: meeting!.Meeting!.MeetingArn,
      SinkType: "S3Bucket",
      SinkArn: `arn:aws:s3:::${bucketName}`,
      ChimeSdkMeetingConfiguration: {
        ArtifactsConfiguration: {
          Audio: { MuxType: "AudioOnly" },
          Video: { State: "Disabled" },
          Content: { State: "Disabled" },
        },
      },
    }),
  );

  await mediaClient.send(
    new CreateMediaConcatenationPipelineCommand({
      Sources: [
        {
          Type: "MediaCapturePipeline",
          MediaCapturePipelineSourceConfiguration: {
            MediaPipelineArn: pipeline.MediaCapturePipeline!.MediaPipelineArn,
            ChimeSdkMeetingConfiguration: {
              ArtifactsConfiguration: {
                Audio: {
                  State: "Enabled",
                },
                CompositedVideo: {
                  State: "Disabled",
                },
                Content: {
                  State: "Disabled",
                },
                DataChannel: {
                  State: "Disabled",
                },
                MeetingEvents: {
                  State: "Disabled",
                },
                TranscriptionMessages: {
                  State: "Disabled",
                },
                Video: {
                  State: "Disabled",
                },
              },
            },
          },
        },
      ],
      Sinks: [
        {
          Type: "S3Bucket",
          S3BucketSinkConfiguration: {
            Destination: `arn:aws:s3:::${bucketName}/${meetingId}/concatenated/`,
          },
        },
      ],
    }),
  );

  meetings.set(meetingId, {
    meetingId,
    pipelineId: pipeline.MediaCapturePipeline.MediaPipelineId,
    attendees: [],
    createdAt: new Date(),
  });

  return {
    meeting,
  };
}

export async function createAttendee({
  meetingId,
  ws,
}: {
  meetingId: string;
  ws: ws;
}) {
  const attendee = await meetingClient.send(
    new CreateAttendeeCommand({
      ExternalUserId: uuidv4(),
      MeetingId: meetingId,
    }),
  );

  if (!meetings.has(meetingId)) {
    throw new Error(`${meetingId} room does not exist.`);
  }

  try {
    const meeting = await meetingClient.send(
      new GetMeetingCommand({
        MeetingId: meetingId,
      }),
    );

    meetings.get(meetingId).attendees.push({ attendee, ws });

    return {
      meeting,
      attendee,
    };
  } catch (e) {
    meetings.delete(meetingId);
    return null;
  }
}

export async function removeAttendee({
  meetingId,
  attendee,
}: {
  meetingId: string;
  attendee: CreateAttendeeCommandOutput;
}) {
  if (!meetings.has(meetingId)) {
    throw new Error(`${meetingId} room does not exist.`);
  }

  const meeting = meetings.get(meetingId);

  await meetingClient.send(
    new DeleteAttendeeCommand({
      MeetingId: meeting.meetingId,
      AttendeeId: attendee.Attendee.AttendeeId,
    }),
  );

  meeting.attendees = meeting.attendees.filter(
    (a) => a.attendee.Attendee.AttendeeId !== attendee.Attendee.AttendeeId,
  );

  if (meeting.attendees.length === 0) {
    destroyMeeting(meetingId);
  }
}

async function destroyMeeting(meetingId: string) {
  const meeting = meetings.get(meetingId);

  const attendees = await meetingClient.send(
    new ListAttendeesCommand({
      MeetingId: meetingId,
    }),
  );

  for (const attendee of attendees.Attendees) {
    await meetingClient.send(
      new DeleteAttendeeCommand({
        MeetingId: meetingId,
        AttendeeId: attendee.AttendeeId,
      }),
    );
  }

  await mediaClient.send(
    new DeleteMediaCapturePipelineCommand({
      MediaPipelineId: meeting.pipelineId,
    }),
  );

  await meetingClient.send(
    new DeleteMeetingCommand({
      MeetingId: meeting.meetingId,
    }),
  );
}
