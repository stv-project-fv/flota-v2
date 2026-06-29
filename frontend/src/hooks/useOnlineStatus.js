import { useEffect } from "react";
import { useStore } from "../store/useStore";

export function useOnlineStatus() {
  const setOnline = useStore((s) => s.setOnline);

  useEffect(() => {
    const handle = () => setOnline(navigator.onLine);
    window.addEventListener("online", handle);
    window.addEventListener("offline", handle);
    return () => {
      window.removeEventListener("online", handle);
      window.removeEventListener("offline", handle);
    };
  }, [setOnline]);
}
