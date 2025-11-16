import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../../lib/network";
import type {
  CreateRoomResponse,
  GetPastRoomsResponse,
  GetRoomsResponse,
} from "@app/shared";
import { useRoom } from "../../context/RoomContext";

export default function useRooms() {
  const { setValue } = useRoom();
  const { isLoading: isRoomsLoading, data: { rooms } = {} } = useQuery({
    queryKey: ["rooms"],
    queryFn: () =>
      api.get("/rooms").then((res) => res.data as GetRoomsResponse),
    staleTime: 0,
    refetchInterval: 3000,
  });
  const { isLoading: isPastRoomsLoading, data: { rooms: pastRooms } = {} } =
    useQuery({
      queryKey: ["pastRooms"],
      queryFn: () =>
        api.get("/past-rooms").then((res) => res.data as GetPastRoomsResponse),
      staleTime: 0,
      refetchInterval: 3000,
    });
  const { mutate: createRoom, isPending: isCreating } = useMutation({
    mutationFn: () =>
      api.post("/rooms").then((res) => res.data as CreateRoomResponse),
    onSuccess: (res) => {
      setValue({ meeting: res.meeting, attendee: null });
    },
  });

  return {
    rooms,
    isRoomsLoading,
    pastRooms,
    isPastRoomsLoading,
    createRoom,
    isCreating,
  };
}
