import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Use a safe temp directory (no spaces)
const outputDir = path.resolve("./temp");
const outputAudio = path.join(outputDir, "audio.wav");

// Ensure temp directory exists
fs.mkdirSync(outputDir, { recursive: true });

// Clean up old file if it exists
if (fs.existsSync(outputAudio)) {
  fs.unlinkSync(outputAudio);
}

export function extractAudio(video) {
  return new Promise((resolve, reject) => {
    try {
      console.log("🎬 Starting audio extraction...");
      console.log("checking if i got video or not", video)

      ffmpeg(video)
        .noVideo()
        .audioCodec("pcm_s16le")
        .audioChannels(1)
        .audioFrequency(16000)
        .output(outputAudio) // safer than .save()
        .on("end", async () => {
          console.log("✅ Audio extracted successfully:", outputAudio);
          try {
            const text = await AudioToSpeech(outputAudio);
            resolve(text);
          } catch (error) {
            console.error("❌ Audio transcription failed:", error);
            reject(error);
          }
        })
        .on("error", (err) => {
          console.error("❌ FFmpeg error:", err.message);
          reject(err);
        })
        .run(); // Explicitly start ffmpeg
    } catch (error) {
      console.error("❌ Unexpected error:", error.message);
      reject(error);
    }
  });
}

async function AudioToSpeech(outputAudio) {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(outputAudio),
      model: "gpt-4o-mini-transcribe",
    });

    const text = transcription.text;
    console.log("📝 Transcription:", text);
    return text;
  } catch (error) {
    console.error("❌ Error while converting audio to text:", error);
    throw error;
  }
}
