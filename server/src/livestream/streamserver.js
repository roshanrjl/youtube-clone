import express from "express";
import { WebSocketServer } from "ws";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const app = express();
const PORT_HTTP = 8000;
const PORT_WS = 8000;

const mediaroot = path.join(__dirname, "./media");
if (!fs.existsSync(mediaroot)) fs.mkdirSync(mediaroot, { recursive: true });

app.use("/live", express.static(mediaroot));

app.listen(PORT_HTTP, () => {
  console.log(`HTTP server running at http://localhost:${PORT_HTTP}`);
});

// WebSocket server
const wss = new WebSocketServer({ port: PORT_WS });
console.log(`WebSocket server running at ws://localhost:${PORT_WS}`);

wss.on("connection", (ws, req) => {
  let ffmpeg;
  let userStreamKey = null;
  ws.on("message", (message) => {
    if (!userStreamKey) {
      userStreamKey = message.toString();

      const userDir = path.join(mediaRoot, userStreamKey);
      if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });

      const streamPath = path.join(userDir, "stream.m3u8");

      // Spawn FFmpeg to convert MediaRecorder blobs to HLS
      ffmpeg = spawn("C:/ffmpeg-7.1.1-essentials_build/bin/ffmpeg.exe", [
        "-i",
        "pipe:0",
        "-c:v",
        "libx264",
        "-c:a",
        "aac",
        "-f",
        "hls",
        "-hls_time",
        "2",
        "-hls_list_size",
        "3",
        "-hls_flags",
        "delete_segments",
        streamPath,
      ]);

      ffmpeg.stderr.on("data", (data) => {
        console.log(`[FFmpeg ${userStreamKey}]: ${data}`);
      });

      ffmpeg.on("close", () => {
        console.log(`FFmpeg process for ${userStreamKey} closed`);
      });

      return; // first message is just stream key
    }
    if (ffmpeg) ffmpeg.stdin.write(message);
  });
  ws.on("close", () => {
    console.log(`Stream ${userStreamKey} ended`);
    if (ffmpeg) {
      ffmpeg.stdin.end();
      ffmpeg.kill();
    }
  });
});
