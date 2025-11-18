# How to Start

1. Install Dependencies

```
> pnpm install
```

2. Set up Environment Variables

In each folder, it has a `.env.example` file.

Create `.env` file and set up environment variables

3. Run Frontend Dev Server

> pnpm run frontend:dev

4. Run Backend Dev Server

> pnpm run backend:dev

```

---

# Build a Voice Chat App Using AWS Chime SDK (React + Node.js)

I’m going to show you how to implement voice chat using the Amazon Chime SDK. It took me a while to get it working the way I wanted, and good information was weirdly hard to find. AI hallucinations didn’t help either — they just stressed me out. Hopefully this post helps anyone in the same situation.

---

## What is the Amazon Chime SDK?

> The Amazon Chime SDK is a set of real-time communications components that you can use to quickly add messaging, audio, video, and screen sharing capabilities to your web or mobile applications.

---

## Features

- Voice Chat
- Voice Recording

---

The example consists of two pages.

### Voice Room List

![voice room list](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ueiis1g307vhhnpt8rsk.png)

This page shows active voice rooms and past rooms. When a room has no attendees, it moves to the past rooms list.

The audio recording starts as soon as the meeting is created, and each past room will get a download button once processing is finished.

---

### Voice Room

![voice room](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/1zlzm7h9vjv0jkduaprs.png)

Users can talk to each other here. If the user clicks the leave button, the server deletes their attendee. When no attendees remain, the server deletes the meeting and the Chime Concatenation API merges the audio files from the Media Pipeline into a single file.

---

![Structure](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/rnfi2vwae40r8u739mq1.png)

Here’s how it works:

## Create a Meeting

1. Clicking the **Create Room** button sends a request to the server to create a meeting.
2. The server creates the meeting, a media capture pipeline attached to it, and a concatenation pipeline attached to the media pipeline.
3. The server returns the meeting ID to the client.
4. The client receives the meeting ID and navigates to the voice room page.
5. The client connects to the WebSocket server and sends the meeting ID.
6. The server creates an attendee and returns the Chime Meeting and Attendee objects.
7. The client sets up the Chime SDK using those objects.
8. Users can now talk.

Joining a meeting works the same way — it starts from step four.

---

You can find the full code on GitHub, but here I’ll highlight a few important parts:

- Setting up Amazon (IAM User, S3)
- Creating Amazon Resources (Meeting, Attendee, Media Pipeline, Concatenation Pipeline)
- Setting up the Chime SDK on the frontend

---

## Set up Amazon

![Chime sdk permission](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/wgfee7w2ogv7n22wsue6.png)

Your IAM user needs permission to access the Amazon Chime SDK.

![Bucket Policy](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ajbhznh36eiwqq4np1tg.png)

```

"Service": "mediapipelines.chime.amazonaws.com"

````

This allows the Chime SDK to access your S3 bucket and create audio files.

I also added an extra policy so the IAM user can access S3 directly.

---

## Create Amazon Resources

### Meeting

```typescript
const meeting = await meetingClient.send(
  new CreateMeetingCommand({
    ExternalMeetingId: uuidv4(),
    MediaRegion: region,
  }),
);
````

Before creating anything, you should understand the two “panels”:

- **Control Panel** — manages resources
- **Data Panel** — manages media flow

Available regions are listed here:  
https://docs.aws.amazon.com/chime-sdk/latest/dg/sdk-available-regions.html

Older SDK versions may only support `us-east-1`.

---

### Attendee

```typescript
const attendee = await meetingClient.send(
  new CreateAttendeeCommand({
    ExternalUserId: uuidv4(),
    MeetingId: meetingId,
  }),
);
```

You need a meeting ID to create an attendee. The client needs both the meeting and attendee objects to connect. You aren’t charged until someone actually joins the meeting.

---

### Media Pipeline

```typescript
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
```

In this example I record audio only. You just pass the bucket name — no need to specify the bucket region because S3 bucket names are globally unique.

This pipeline records audio and uploads small audio chunks roughly every five seconds.

![audio files](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/fytces62aij5ap84k97c.png)

But I want a single audio file, not a pile of tiny ones, so this is where the Concatenation API comes in.

Also note: the media pipeline records even when no one is in the meeting. You must explicitly delete it using `DeleteMediaCapturePipelineCommand` so you aren’t billed unnecessarily and so your final audio doesn't include an empty five-minute tail.

---

### Concatenation Pipeline

```typescript
await mediaClient.send(
  new CreateMediaConcatenationPipelineCommand({
    Sources: [
      {
        Type: "MediaCapturePipeline",
        MediaCapturePipelineSourceConfiguration: {
          MediaPipelineArn: pipeline.MediaCapturePipeline!.MediaPipelineArn,
          ChimeSdkMeetingConfiguration: {
            ArtifactsConfiguration: {
              Audio: { State: "Enabled" },
              CompositedVideo: { State: "Disabled" },
              Content: { State: "Disabled" },
              DataChannel: { State: "Disabled" },
              MeetingEvents: { State: "Disabled" },
              TranscriptionMessages: { State: "Disabled" },
              Video: { State: "Disabled" },
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
```

Here, you specify where you want the final merged audio file to go. I place it in a `concatenated` folder inside the meeting folder (the meeting ID is the default folder name created by the Media Pipeline).

This pipeline doesn’t need to be deleted — it runs automatically once the Media Pipeline is destroyed.

---

### Setting up the Chime SDK on the Frontend

```typescript
const setupChime = useEffectEvent(async () => {
  const configuration = new MeetingSessionConfiguration(
    value.meeting!,
    value.attendee!,
  );

  const logger = new ConsoleLogger("ChimeLogs", LogLevel.ERROR);
  const deviceController = new DefaultDeviceController(logger);
  const meetingSession = new DefaultMeetingSession(
    configuration,
    logger,
    deviceController,
  );

  deviceController.setDeviceLabelTrigger(async () => {
    return navigator.mediaDevices.getUserMedia({ audio: true });
  });

  const audioVideo = meetingSession.audioVideo;
  const mics = await audioVideo.listAudioInputDevices();

  await audioVideo.startAudioInput(mics[0].deviceId);
  await audioVideo.bindAudioElement(audioRef.current!);

  meetingSession.audioVideo.start();

  session.current = meetingSession;
});
```

`value.meeting` and `value.attendee` come from the server.
I call `getUserMedia` with audio-only permissions because otherwise the browser will prompt for video as well.

Once `audioVideo.start()` runs, users in the same room can talk to each other.

To clean everything up when the user leaves the room, I use the following code:

```typescript
const destroyChime = useEffectEvent(async () => {
  if (!session.current) return;
  const meetingSession = session.current;

  meetingSession.audioVideo.stop();
  await meetingSession.audioVideo.stopAudioInput?.();
  meetingSession.audioVideo?.unbindAudioElement?.();
  await meetingSession.deviceController.destroy();
  await meetingSession.destroy();
});
```

It’s a bit rough — it throws an error — but it still works.
Use it as a reference rather than a final implementation.

---

## Wrap Up

This example might miss a few small details, and your own setup may vary depending on your project. Treat this as a reference rather than a full guide.

You can find the full code here:  
https://github.com/hsk-kr/chime-audio-recording-example

Hope it helps. Happy coding!
