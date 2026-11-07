import { describe, expect, it } from "vitest";
import { MAX_AUDIO_BYTES, MAX_COVER_BYTES, validateUpload } from "./upload";

describe("limites e tipos dos ficheiros de submissão", () => {
  it("aceita áudio até 50MB e recusa um ficheiro maior", () => {
    expect(validateUpload({ size: MAX_AUDIO_BYTES, type: "audio/wav" }, "audio")).toBeNull();
    expect(validateUpload({ size: MAX_AUDIO_BYTES + 1, type: "audio/wav" }, "audio")).toBe(
      "O ficheiro de áudio não pode exceder 50MB.",
    );
  });

  it("aceita capa até 5MB e recusa uma imagem maior", () => {
    expect(validateUpload({ size: MAX_COVER_BYTES, type: "image/png" }, "cover")).toBeNull();
    expect(validateUpload({ size: MAX_COVER_BYTES + 1, type: "image/png" }, "cover")).toBe(
      "O ficheiro de imagem não pode exceder 5MB.",
    );
  });

  it("não aceita um tipo de ficheiro diferente do campo", () => {
    expect(validateUpload({ size: 100, type: "image/png" }, "audio")).toBe(
      "Escolhe um ficheiro de áudio válido.",
    );
    expect(validateUpload({ size: 100, type: "audio/wav" }, "cover")).toBe(
      "Escolhe um ficheiro de imagem válido.",
    );
  });
});
