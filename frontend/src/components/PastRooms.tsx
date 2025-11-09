import dayjs from "dayjs";
import { LuClock9 } from "react-icons/lu";
import Button from "./Button";

type PastRoomProps = {
  id: string;
  audioUrl: string | null;
  createdAt: string;
};

export default function PastRooms({
  pastRooms,
}: {
  pastRooms: PastRoomProps[];
}) {
  return (
    <div className="space-y-6">
      <h2 className="font-medium text-lg">Past Rooms</h2>
      <div className="space-y-4">
        {pastRooms.map((pastRoom) => (
          <PastRoom key={pastRoom.id} {...pastRoom} />
        ))}
      </div>
    </div>
  );
}

function PastRoom({ id, audioUrl, createdAt }: PastRoomProps) {
  const handleDownload = () => {
    alert(audioUrl);
  };
  return (
    <div className="flex justify-between bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg p-4 hover:border-[#14B8A6]/30 transition-all duration-300 hover:shadow-md hover:shadow-[#14B8A6]/5">
      <div className="space-y-2">
        <div>{id}</div>
        <p className="flex gap-2 items-center text-sm text-zinc-400">
          <LuClock9 /> {dayjs(createdAt).format("YYYY-MM-DD HH:mm:ss")}
        </p>
      </div>
      <div className="flex items-center">
        <Button variant="outline" onClick={handleDownload}>
          Download
        </Button>
      </div>
    </div>
  );
}
