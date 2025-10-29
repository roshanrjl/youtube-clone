import { spawn } from "child_process";

export function generateTitle(description) {
  return new Promise((resolve, reject) => {
    const pyProcess = spawn("python", ["./src/utils/generateTitle.py", description], { stdio: ["pipe", "pipe", "pipe"] });

    let output = "";
    let errorOutput = "";

    pyProcess.stdout.on("data", (data) => {
      output += data.toString("utf8");
    });

    pyProcess.stderr.on("data", (data) => {
      errorOutput += data.toString("utf8");
    });

    pyProcess.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(errorOutput || `Python exited with code ${code}`));
      }
      resolve(output.trim());
    });
  });
}
