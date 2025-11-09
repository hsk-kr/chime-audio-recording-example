import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { WebSocketServer } from "ws";
import { WebsocketPacket } from "@app/shared";
import {
  CreateAttendeeCommandOutput,
  CreateMeetingCommandOutput,
} from "@aws-sdk/client-chime-sdk-meetings";
import { createAttendee, meetings, removeAttendee } from "./chime.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT);
const websocketPort = Number(process.env.WS_PORT!);

app.use(cors());
app.use(express.json());

app
  .route("/meetings")
  .get(async (req, res) => {
    return res.json({
      success: true,
    });
  })
  .post(async (req, res) => {
    return res.json({
      success: true,
    });
  });

const wss = new WebSocketServer({ port: websocketPort });

wss.on("connection", function connection(ws) {
  const client: {
    meetingId: string;
    attendee: CreateAttendeeCommandOutput;
  } | null = null;

  const sendAttendeeCnt = () => {
    if (client === null) return;

    const attendees = meetings.get(client.meetingId).attendees;

    for (const attendee of attendees) {
      attendee.ws.send(
        JSON.stringify({
          type: "attendeesCnt",
          data: {
            cnt: attendees.length,
          },
        } satisfies WebsocketPacket),
      );
    }
  };

  ws.on("error", (e) => {
    console.error(e);
    ws.close();
  });

  ws.on("message", async function message(data) {
    const d = JSON.parse(data.toString()) as WebsocketPacket;

    switch (d.type) {
      case "connect":
        const { meeting, attendee } = await createAttendee({
          meetingId: d.meetingId,
          ws,
        });

        client.meetingId = d.meetingId;
        client.attendee = attendee;

        ws.send(
          JSON.stringify({
            type: "connected",
            data: {
              meeting,
              attendee,
            },
          } satisfies WebsocketPacket),
        );
        void sendAttendeeCnt();

        break;
      default:
        console.log(`unknown data: ${data.toString()}`);
    }
  });

  ws.on("close", async () => {
    if (client === null) return;
    await removeAttendee({
      meetingId: client.meetingId,
      attendee: client.attendee,
    });
    void sendAttendeeCnt();
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
