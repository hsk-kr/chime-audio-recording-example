import { MdPeopleAlt } from "react-icons/md";
import Button from "./Button";

type ActiveRoomProps = {
  id: string;
  attendeeCnt: number;
};

export default function ActiveRooms({
  activeRooms,
}: {
  activeRooms: ActiveRoomProps[];
}) {
  return (
    <div className="space-y-6">
      <h2 className="font-medium text-lg">Active Rooms</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {activeRooms.map((activeRoom) => (
          <ActiveRoom key={activeRoom.id} {...activeRoom} />
        ))}
      </div>
    </div>
  );
}

function ActiveRoom({ id, attendeeCnt }: ActiveRoomProps) {
  return (
    <div className="space-y-4 rounded-xl border bg-linear-to-br from-[#1C1C1C] to-[#0F0F0F] border-[#2A2A2A] hover:border-[#14B8A6]/50 transition-all duration-200 p-6 group hover:shadow-lg hover:shadow-[#14B8A6]/10">
      <div>{id}</div>
      <p className="flex gap-2 items-center text-sm text-zinc-400">
        <MdPeopleAlt /> {attendeeCnt} attendees
      </p>
      <div>
        <Button>Join</Button>
      </div>
    </div>
  );
}
