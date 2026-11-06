import { describe, expect, it } from "vitest";
import { canApproveTrack, canDownloadTrack, type LicenseRule, type TrackRightsRule } from "./rights";

const today = "2026-11-06";
const license: LicenseRule = { verification_status: "verified", allows_streaming: true, allows_download: true, starts_at: "2026-01-01", ends_at: "2026-12-31" };
const track: TrackRightsRule = { status: "pending", is_demo: false, rights_confirmed: true, rights_holders: "Autor e produtor", consent_streaming: true, consent_download: true };

describe("regras de direitos", () => {
  it("uma faixa real sem licença de streaming verificada não pode ser aprovada", () => {
    expect(canApproveTrack(track, { ...license, verification_status: "pending" }, today)).toBe(false);
    expect(canApproveTrack(track, license, today)).toBe(true);
  });

  it("uma licença expirada não permite publicar", () => {
    expect(canApproveTrack(track, { ...license, ends_at: "2026-11-05" }, today)).toBe(false);
  });

  it("sem consentimento de streaming não há aprovação", () => {
    expect(canApproveTrack({ ...track, consent_streaming: false }, license, today)).toBe(false);
  });

  it("download exige faixa aprovada, consentimento e licença de download", () => {
    expect(canDownloadTrack(track, license, today)).toBe(false);
    expect(canDownloadTrack({ ...track, status: "approved" }, { ...license, allows_download: false }, today)).toBe(false);
    expect(canDownloadTrack({ ...track, status: "approved", consent_download: false }, license, today)).toBe(false);
    expect(canDownloadTrack({ ...track, status: "approved" }, license, today)).toBe(true);
  });

  it("conteúdo demo nunca disponibiliza download", () => {
    expect(canDownloadTrack({ ...track, status: "approved", is_demo: true }, license, today)).toBe(false);
  });
});
