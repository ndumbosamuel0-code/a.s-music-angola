export const MAX_AUDIO_BYTES = 50 * 1024 * 1024;
export const MAX_COVER_BYTES = 5 * 1024 * 1024;

type UploadFile = Pick<File, "size" | "type">;

export function validateUpload(file: UploadFile, kind: "audio" | "cover") {
  const isAudio = kind === "audio";
  const expectedType = isAudio ? "audio/" : "image/";
  const limit = isAudio ? MAX_AUDIO_BYTES : MAX_COVER_BYTES;
  const label = isAudio ? "áudio" : "imagem";
  const limitMb = isAudio ? 50 : 5;

  if (!file.type.startsWith(expectedType)) return `Escolhe um ficheiro de ${label} válido.`;
  if (file.size <= 0) return `O ficheiro de ${label} está vazio.`;
  if (file.size > limit) return `O ficheiro de ${label} não pode exceder ${limitMb}MB.`;
  return null;
}
