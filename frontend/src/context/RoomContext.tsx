import { createContext, useContext, useState, type ReactNode } from "react";

type RoomContextValue = {
  meeting: any;
  attendee: any;
};

type RoomContextType = {
  value: RoomContextValue;
  setValue: (
    value:
      | RoomContextType["value"]
      | ((prevValue: RoomContextType["value"]) => RoomContextType["value"]),
  ) => void;
};

const RoomContext = createContext<RoomContextType>({} as RoomContextType);

export const RoomContextProvider = ({ children }: { children: ReactNode }) => {
  const [value, setValue] = useState<RoomContextType["value"]>({
    meeting: null,
    attendee: null,
  });

  return (
    <RoomContext.Provider value={{ value, setValue }}>
      {children}
    </RoomContext.Provider>
  );
};

export const useRoom = () => {
  return useContext(RoomContext);
};
