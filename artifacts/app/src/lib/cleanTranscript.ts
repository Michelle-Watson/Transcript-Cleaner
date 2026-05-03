export function cleanTranscript(raw: string): string {
  let text = raw;

  // 1. Normalize line endings
  text = text.replace(/\r\n/g, "\n");

  // 2. Remove WEBVTT header line
  text = text.replace(/^WEBVTT\s*/m, "");

  // 3. Remove cue index lines (lines that are just digits, e.g. "1", "2", "3")
  text = text.replace(/^\d+\s*$/gm, "");

  // 4. Remove timestamp+arrow lines
  text = text.replace(/\d{1,2}:\d{2}(:\d{2})?(\.\d+)?\s*-->\s*\d{1,2}:\d{2}(:\d{2})?(\.\d+)?/g, "");

  // 5. Remove any remaining "--> " occurrences (arrow + space) and bare "-->"
  text = text.replace(/--> /g, "");
  text = text.replace(/-->/g, "");

  // 6. Replace "…" (U+2026) and "..." with ","
  text = text.replace(/…/g, ",");
  text = text.replace(/\.\.\./g, ",");

  // 7. Strip lines that are now empty after the above transforms
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);

  // 8. Merge consecutive speaker lines
  const speakerPattern = /^(.+?):\s+(.*)$/;
  const merged: string[] = [];
  let currentSpeaker: string | null = null;
  let currentContent: string[] = [];

  for (const line of lines) {
    const match = speakerPattern.exec(line);
    if (match) {
      const speaker = match[1];
      const content = match[2];
      
      if (currentSpeaker === speaker) {
        currentContent.push(content);
      } else {
        if (currentSpeaker !== null) {
          merged.push(`${currentSpeaker}: ${currentContent.join(" ").trim()}`);
          if (speaker !== currentSpeaker) {
            merged.push(""); // Insert blank line between different speakers
          }
        }
        currentSpeaker = speaker;
        currentContent = [content];
      }
    } else {
      if (currentSpeaker !== null) {
        currentContent.push(line);
      } else {
        // If there's no speaker yet, just push the line
        merged.push(line);
      }
    }
  }
  
  if (currentSpeaker !== null) {
    merged.push(`${currentSpeaker}: ${currentContent.join(" ").trim()}`);
  }

  return merged.join("\n").trim();
}
