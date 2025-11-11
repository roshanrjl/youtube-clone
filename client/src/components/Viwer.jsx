import React, { useEffect } from "react";
import { watchBroadcast } from "../socketClient/socket";

function Viewer({ broadcasterId }) {
  useEffect(() => {
    watchBroadcast(broadcasterId);
  }, [broadcasterId]);

  return <video id={`video_${broadcasterId}`} autoPlay style={{ width: "400px" }} />;
}

export default Viewer;
