import { MdPeopleAlt } from "react-icons/md";
import { FaMicrophone } from "react-icons/fa6";
import { RxExit } from "react-icons/rx";
import {
  ConsoleLogger,
  DefaultDeviceController,
  DefaultMeetingSession,
  LogLevel,
  MeetingSessionConfiguration,
} from "amazon-chime-sdk-js";

import Button from "../components/Button";
import { useRoom } from "../context/RoomContext";
import { Activity, useEffect, useEffectEvent, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import useClient from "../hooks/apis/useClient";

export default function RoomPage() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const navigate = useNavigate();
  const params = useParams();
  const session = useRef<DefaultMeetingSession | null>(null);
  const { value, setValue } = useRoom();
  const { connected, attendeeCnt, error } = useClient({
    meetingId: params.meetingId!,
  });

  const handleRoomLeave = () => {
    setValue({ meeting: null, attendee: null });
    navigate("/");
  };

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

  const destroyChime = useEffectEvent(async () => {
    if (!session.current) return;
    const meetingSession = session.current;

    meetingSession.audioVideo.stop();
    await meetingSession.audioVideo.stopAudioInput?.();
    meetingSession.audioVideo?.unbindAudioElement?.();
    await meetingSession.deviceController.destroy();
    await meetingSession.destroy();
  });

  useEffect(() => {
    if (!connected) {
      return;
    }

    setupChime();
  }, [connected]);

  useEffect(() => {
    return () => {
      destroyChime();
    };
  }, []);

  useEffect(() => {
    if (!error) return;

    navigate("/");
  }, [error]);

  if (!connected) {
    return (
      <div className="flex flex-col min-h-screen bg-linear-to-br from-[#0F0F0F] via-[#1C1C1C] to-[#0F0F0F]"></div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-linear-to-br from-[#0F0F0F] via-[#1C1C1C] to-[#0F0F0F]">
      <audio ref={audioRef} />
      <div className="border-b border-[#2A2A2A] bg-[#0F0F0F]/80 sticky px-8 py-4">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <div className="space-y-2">
            <h1>sdfasdf-sdf-asdfa-sdfsaf-</h1>
            <div className="flex gap-4 items-center">
              <div className="flex gap-2 text-zinc-400 text-sm items-center">
                <Activity mode={attendeeCnt === 0 ? "hidden" : "visible"}>
                  <MdPeopleAlt /> {attendeeCnt} attendees
                </Activity>
              </div>
              <div className="flex gap-1 items-center">
                <div className="w-2 h-2 rounded-full animate-pulse bg-teal-500"></div>
                <p className="animate-pulse text-teal-500 text-sm">
                  Recording...
                </p>
              </div>
            </div>
          </div>
          <Button color="danger" variant="outline" onClick={handleRoomLeave}>
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
