"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

// How often to tell the server "this user is still online"
const HEARTBEAT_INTERVAL_MS = 30 * 1000; // 30 seconds

// Invisible component: renders nothing, only sends pings while a user is logged in
export default function PresenceHeartbeat() {
  const { status } = useSession();

  useEffect(() => {
    // Do nothing for logged-out visitors
    if (status !== "authenticated") return;

    const sendHeartbeat = () => {
      fetch("/api/presence/heartbeat", { method: "POST", keepalive: true })
        .catch(() => {}); // ignore network errors, the next ping will retry
    };

    sendHeartbeat(); // ping immediately when the user logs in / opens the site
    const intervalId = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS); // then every 30 seconds

    // Stop pinging when the user logs out or closes the tab
    return () => clearInterval(intervalId);
  }, [status]);

  return null; // nothing to display
}