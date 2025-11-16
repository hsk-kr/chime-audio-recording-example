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
    path: "/:meetingId",
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
