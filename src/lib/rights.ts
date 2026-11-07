export type LicenseRule = {
  verification_status: string;
  allows_streaming: boolean;
  allows_download: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

export type TrackRightsRule = {
  status: string;
  is_demo: boolean;
  rights_confirmed: boolean;
  rights_holders: string | null;
  consent_streaming: boolean;
  consent_download: boolean;
};

function activeLicense(license: LicenseRule | undefined, today: string) {
  return (
    !!license &&
    license.verification_status === "verified" &&
    (!license.starts_at || license.starts_at <= today) &&
    (!license.ends_at || license.ends_at >= today)
  );
}

/** Espelha no painel as regras aplicadas pela base de dados. */
export function canApproveTrack(
  track: TrackRightsRule,
  license: LicenseRule | undefined,
  today = new Date().toISOString().slice(0, 10),
) {
  if (track.is_demo) return true;
  return (
    track.rights_confirmed &&
    track.consent_streaming &&
    !!track.rights_holders?.trim() &&
    activeLicense(license, today) &&
    !!license?.allows_streaming
  );
}

export function canDownloadTrack(
  track: TrackRightsRule,
  license: LicenseRule | undefined,
  today = new Date().toISOString().slice(0, 10),
) {
  return (
    track.status === "approved" &&
    !track.is_demo &&
    track.consent_download &&
    canApproveTrack(track, license, today) &&
    !!license?.allows_download
  );
}
