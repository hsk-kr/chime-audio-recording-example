import type { WebsocketPacket } from "@app/shared";
import { useEffect, useState } from "react";
import { useRoom } from "../../context/RoomContext";

export default function useClient({ meetingId }: { meetingId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [attendeeCnt, setAttendeeCnt] = useState(0);
  const { setValue } = useRoom();
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    const socket = new WebSocket(import.meta.env.VITE_APP_WS_URL);

    socket.addEventListener("open", () => {
      socket.send(
        JSON.stringify({
          type: "connect",
          data: {
            meetingId,
          },
        } satisfies WebsocketPacket),
      );
    });

    socket.addEventListener("message", (event) => {
      const d = JSON.parse(event.data) as WebsocketPacket;

      switch (d.type) {
        case "connected":
          setValue({
            ...d.data,
          });
          setConnected(true);
          break;
        case "attendeesCnt":
          setAttendeeCnt(d.data.cnt);
          break;
      }
    });

    socket.addEventListener("error", () => {
      setError("Failed to connect to server");
      setConnected(false);
    });

    socket.addEventListener("close", () => {
      setError("Connection is closed from server");
    });

    return () => {
      socket.close();
    };
  }, []);

  return {
    error,
    connected,
    attendeeCnt,
  };
}
