import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../../lib/network";
import type { CreateRoomResponse, GetRoomsResponse } from "@app/shared";
import { useRoom } from "../../context/RoomContext";

export default function useRooms() {
  const { setValue } = useRoom();
  const { isLoading, data } = useQuery({
    queryKey: ["rooms"],
    queryFn: () =>
      api.get("/rooms").then((res) => res.data as GetRoomsResponse),
  });
  const { mutate: createRoom, isPending: isCreating } = useMutation({
    mutationFn: () =>
      api.post("/rooms").then((res) => res.data as CreateRoomResponse),
    onSuccess: (res) => {
      setValue({ meeting: res.meeting, attendee: null });
    },
  });

  return {
    rooms: data?.rooms,
    isLoading,
    createRoom,
    isCreating,
  };
}
