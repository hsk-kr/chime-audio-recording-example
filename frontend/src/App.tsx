import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router";
import RoomPage from "./pages/RoomPage";
import RoomListPage from "./pages/RoomListPage";
import { RoomContextProvider } from "./context/RoomContext";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <RoomListPage />,
  },
  {
    path: "/:id",
    element: <RoomPage />,
  },
]);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RoomContextProvider>
        <RouterProvider router={router} />
      </RoomContextProvider>
    </QueryClientProvider>
  );
}

// import { useMutation, useQuery } from "@tanstack/react-query";
// import axios from "axios";
// import type {
//   CreateMeetingResponse,
//   GetMeetingsResponse,
//   JoinMeetingResponse,
// } from "@app/shared/types";
// import { Activity, useEffect, useEffectEvent, useRef, useState } from "react";
// import {
//   ConsoleLogger,
//   DefaultDeviceController,
//   DefaultMeetingSession,
//   LogLevel,
//   MeetingSessionConfiguration,
// } from "amazon-chime-sdk-js";
//
// const api = axios.create({
//   baseURL: "http://localhost:3000",
// });
//
// function App() {
//   const audioRef = useRef<HTMLAudioElement>(null);
//   const [currentMeeting, setCurrentMeeting] = useState<{
//     meeting: any;
//     attendee: any;
//   } | null>(null);
//   const { data: meetings } = useQuery<GetMeetingsResponse>({
//     queryKey: ["meetings"],
//     queryFn: () => api.get("/meetings").then((res) => res.data.meetings),
//   });
//
//   const { mutate: createMeeting, isPending: createMeetingLoading } =
//     useMutation<CreateMeetingResponse>({
//       mutationFn: () => api.post("/meetings").then((res) => res.data),
//       onSuccess: (data) => {
//         setCurrentMeeting({
//           ...data,
//         });
//       },
//     });
//
//   const { mutate: joinMeeting, isPending: joinMeetingLoading } = useMutation<
//     JoinMeetingResponse,
//     Error,
//     string
//   >({
//     mutationFn: (meetingId: string) =>
//       api.post(`/meetings/${meetingId}`).then((res) => res.data),
//     onSuccess: (data) => {
//       setCurrentMeeting({
//         ...data,
//       });
//     },
//   });
//
//   const inMeeting = currentMeeting !== null;
//
//   const handleMeetingCreate = () => {
//     createMeeting();
//   };
//
//   const handleMeetingJoin = (meetingId: string) => () => {
//     joinMeeting(meetingId);
//   };
//
//   const setupChime = useEffectEvent(async () => {
//     if (!currentMeeting) return;
//
//     const configuration = new MeetingSessionConfiguration(
//       currentMeeting.meeting,
//       currentMeeting?.attendee,
//     );
//
//     const logger = new ConsoleLogger("ChimeLogs", LogLevel.INFO);
//     const deviceController = new DefaultDeviceController(logger);
//     const meetingSession = new DefaultMeetingSession(
//       configuration,
//       logger,
//       deviceController,
//     );
//
//     deviceController.setDeviceLabelTrigger(async () => {
//       return navigator.mediaDevices.getUserMedia({ audio: true });
//     });
//
//     const audioVideo = meetingSession.audioVideo;
//     const mics = await audioVideo.listAudioInputDevices();
//
//     await audioVideo.startAudioInput(mics[0].deviceId);
//     await audioVideo.bindAudioElement(audioRef.current!);
//
//     meetingSession.audioVideo.start();
//   });
//
//   useEffect(() => {
//     if (!currentMeeting) return;
//
//     setupChime();
//   }, [currentMeeting]);
//
//   return (
//     <div className="p-8">
//       <Activity mode={inMeeting ? "visible" : "hidden"}>
//         <div>
//           You are in meeting / {currentMeeting?.meeting.Meeting.MeetingId}
//         </div>
//         <audio ref={audioRef} />
//       </Activity>
//
//       <Activity mode={!inMeeting ? "visible" : "hidden"}>
//         <div className="space-y-2">
//           <button
//             className="btn btn-primary"
//             onClick={handleMeetingCreate}
//             disabled={createMeetingLoading || joinMeetingLoading}
//           >
//             Create Meeting
//           </button>
//           <h2>Meetings</h2>
//           <ul className="list bg-base-100 rounded-box shadow-md">
//             {meetings?.map((meeting, meetingIndex) => (
//               <li className="list-row" key={meetingIndex}>
//                 <div>
//                   <div>{meeting.meetingId}</div>
//                   <div className="text-xs uppercase font-semibold opacity-60">
//                     {meeting.attendeeCount} people /{" "}
//                     {new Date(meeting.createdAt).toISOString()}
//                   </div>
//                 </div>
//                 <button
//                   className="btn btn-secondary"
//                   disabled={joinMeetingLoading}
//                   onClick={handleMeetingJoin(meeting.meetingId)}
//                 >
//                   Join Meeting
//                 </button>
//               </li>
//             ))}
//             {meetings?.length === 0 ? (
//               <li className="p-4 pb-2 text-xs opacity-60 tracking-wide">
//                 No Meetings
//               </li>
//             ) : null}
//           </ul>
//           <ul></ul>
//         </div>
//       </Activity>
//     </div>
//   );
// }
//
// export default App;
