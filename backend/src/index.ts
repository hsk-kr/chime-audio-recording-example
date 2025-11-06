import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import {
  ChimeSDKMeetingsClient,
  CreateAttendeeCommand,
  CreateAttendeeCommandOutput,
  CreateMeetingCommand,
  ListAttendeesCommand,
  GetMeetingCommand,
  GetMeetingCommandOutput,
} from "@aws-sdk/client-chime-sdk-meetings";
import { GetMeetingsResponse } from "@app/shared";
import {
  ChimeSDKMediaPipelines,
  CreateMediaCapturePipelineCommand,
  CreateMediaConcatenationPipelineCommand,
} from "@aws-sdk/client-chime-sdk-media-pipelines";

dotenv.config();

const app = express();
const port = Number(process.env.PORT);

const accessKeyId = process.env.AWS_ACCESS_KEY!;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY!;
const region = process.env.AWS_MEETING_REGION!;
const bucketName = process.env.AWS_S3_BUCKET_NAME!;

type Meeting = {
  meetingId: string;
  createdAt: Date;
};

const meetings = new Map<string, Meeting>();

const clientParams = {
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
};

const meetingsClient = new ChimeSDKMeetingsClient(clientParams);

const mediaClient = new ChimeSDKMediaPipelines(clientParams);

app.use(cors());
app.use(express.json());

app
  .route("/meetings")
  .get(async (req, res) => {
    const meetingInformationList: GetMeetingsResponse = [];

    for (const { meetingId, createdAt } of meetings.values()) {
      try {
        const attendees = await meetingsClient.send(
          new ListAttendeesCommand({
            MeetingId: meetingId,
          }),
        );

        meetingInformationList.push({
          meetingId,
          attendeeCount: attendees.Attendees!.length,
          createdAt: createdAt.toString(),
        });
      } catch (e) {
        console.error(e);
      }
    }

    res.json({
      success: true,
      meetings: meetingInformationList,
    });
  })
  .post(async (req, res) => {
    const meeting = await meetingsClient.send(
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

    const attendee = await meetingsClient.send(
      new CreateAttendeeCommand({
        ExternalUserId: uuidv4(),
        MeetingId: meetingId,
      }),
    );

    meetings.set(meetingId, {
      meetingId,
      createdAt: new Date(),
    });

    return res.json({
      success: true,
      meeting,
      attendee,
    });
  });

app.post("/meetings/:meetingId", async (req, res) => {
  const { meetingId } = req.params;
  let meeting: GetMeetingCommandOutput;
  let attendee: CreateAttendeeCommandOutput;

  // todo: test if it catches creation error
  try {
    meeting = await meetingsClient.send(
      new GetMeetingCommand({
        MeetingId: meetingId,
      }),
    );

    attendee = await meetingsClient.send(
      new CreateAttendeeCommand({
        ExternalUserId: uuidv4(),
        MeetingId: meetingId,
      }),
    );
  } catch (e) {
    console.error(e);
    return res.status(400).json({
      success: false,
      error: "Failed to join the meeting",
    });
  }

  return res.json({
    success: true,
    meeting,
    attendee,
  });
});

// test();

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
