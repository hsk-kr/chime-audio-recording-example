import { MdPeopleAlt } from "react-icons/md";
import { FaMicrophone } from "react-icons/fa6";
import { RxExit } from "react-icons/rx";

import Button from "../components/Button";

export default function RoomPage() {
  return (
    <div className="flex flex-col min-h-screen bg-linear-to-br from-[#0F0F0F] via-[#1C1C1C] to-[#0F0F0F]">
      <div className="border-b border-[#2A2A2A] bg-[#0F0F0F]/80 sticky px-8 py-4">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <div className="space-y-2">
            <h1>sdfasdf-sdf-asdfa-sdfsaf-</h1>
            <div className="flex gap-4 items-center">
              <div className="flex gap-2 text-zinc-400 text-sm items-center">
                <MdPeopleAlt /> {8} attendees
              </div>
              <div className="flex gap-1 items-center">
                <div className="w-2 h-2 rounded-full animate-pulse bg-teal-500"></div>
                <p className="animate-pulse text-teal-500 text-sm">
                  Recording...
                </p>
              </div>
            </div>
          </div>
          <Button color="danger" variant="outline">
            <div className="flex items-center gap-2">
              <RxExit />
              Leave Room
            </div>
          </Button>
        </div>
      </div>
      <div className="max-w-6xl mx-auto py-8 px-4 flex-1 flex justify-center items-center gap-4 flex-col">
        <div className="p-12 rounded-full text-white flex justify-center items-center bg-teal-500">
          <FaMicrophone className="text-5xl" />
        </div>
        <p className="text-lg text-teal-500 font-bold">LIVE</p>
      </div>
    </div>
  );
}
