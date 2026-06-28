/**
 * Helper to convert raw 16-bit PCM mono audio data at 24kHz into a playable standard WAV Blob.
 */
export function pcmToWavBlob(base64Pcm: string, sampleRate = 24000): Blob {
  // Decode base64 to binary string
  const binaryString = atob(base64Pcm);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const numChannels = 1; // Mono
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = bytes.length;
  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // file length minus RIFF identifier length (8 bytes)
  view.setUint32(4, 36 + dataSize, true);
  // WAVE identifier
  writeString(view, 8, 'WAVE');
  // format chunk identifier "fmt "
  writeString(view, 12, 'fmt ');
  // format chunk length (16)
  view.setUint32(16, 16, true);
  // sample format (raw PCM is 1)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, byteRate, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, blockAlign, true);
  // bits per sample
  view.setUint16(34, bitsPerSample, true);
  // data chunk identifier "data"
  writeString(view, 36, 'data');
  // chunk length
  view.setUint32(40, dataSize, true);

  // Combine header and PCM bytes
  const wavBytes = new Uint8Array(44 + dataSize);
  wavBytes.set(new Uint8Array(wavHeader), 0);
  wavBytes.set(bytes, 44);

  return new Blob([wavBytes], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
