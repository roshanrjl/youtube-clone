// src/components/ViewerWrapper.jsx
import { useParams } from "react-router-dom";
import Viewer from "./Viwer";

export default function ViewerWrapper() {
  const { broadcasterId } = useParams();
  return <Viewer broadcasterId={broadcasterId} />;
}
