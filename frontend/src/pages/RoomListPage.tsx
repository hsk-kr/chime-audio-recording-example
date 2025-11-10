import { useEffect, useMemo } from "react";
import ActiveRooms from "../components/ActiveRooms";
import Button from "../components/Button";
import PastRooms from "../components/PastRooms";
import useRooms from "../hooks/apis/useRooms";
import { useRoom } from "../context/RoomContext";
import { useNavigate } from "react-router";

export default function RoomListPage() {
  const { rooms, createRoom, isCreating } = useRooms();
  const { value } = useRoom();
  const navigate = useNavigate();

  const activeRooms = useMemo(() => {
    return (
      rooms?.map((r) => ({
        id: r.meetingId,
        attendeeCnt: r.attendeeCnt,
      })) ?? []
    );
  }, [rooms]);

  const handleRoomCreate = () => {
    createRoom();
  };

  useEffect(() => {
    if (!value.meeting) return;

    navigate(`/${value.meeting.Meeting.MeetingId}`);
  }, [value.meeting]);

  return (
    <div className="min-h-screen bg-linear-to-br from-[#0F0F0F] via-[#1C1C1C] to-[#0F0F0F]">
      <div className="border-b border-[#2A2A2A] bg-[#0F0F0F]/80 sticky px-8 py-4">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <h1>Chime SDK Audio Chat/Record Example</h1>
          <Button onClick={handleRoomCreate} disabled={isCreating}>
            Create Room
          </Button>
        </div>
      </div>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <ActiveRooms activeRooms={activeRooms} />
        <div className="h-20" />
        <PastRooms
          pastRooms={[
            {
              id: "asdfasdf",
              audioUrl: null,
              createdAt: new Date().toISOString(),
            },
            {
              id: "dfjsodfv",
              audioUrl: null,
              createdAt: new Date().toISOString(),
            },
          ]}
        />
      </div>
    </div>
  );
}
