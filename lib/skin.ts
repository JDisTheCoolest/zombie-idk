// Server-side check for uploaded skins. A skin is a PNG, 64 wide and 64 tall (or 32 tall for
// old skins), sent as a data: URL. We read the size from the PNG header instead of trusting the browser.
import "server-only";

const MAX_BYTES = 24 * 1024;
const PREFIX = "data:image/png;base64,";

// Returns the error to show, or null if the skin is fine.
export function checkSkin(dataUrl: string): string | null {
  if (!dataUrl.startsWith(PREFIX)) return "Skins must be PNG files.";
  const bytes = Buffer.from(dataUrl.slice(PREFIX.length), "base64");
  if (bytes.length > MAX_BYTES) return "That skin file is too big (24 KB max).";
  const signature = bytes.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a" || bytes.subarray(12, 16).toString("ascii") !== "IHDR") {
    return "That file is not a real PNG.";
  }
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  if (width !== 64 || (height !== 64 && height !== 32)) {
    return `Skins are 64 x 64 pixels (or 64 x 32). That image is ${width} x ${height}.`;
  }
  return null;
}
