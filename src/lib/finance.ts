// Modelo informativo (proposta sujeita a contrato):
// A.S MUSIC recebe `platformSharePct`% do valor que sobra após a comissão do distribuidor;
// o artista recebe o restante.
export function splitRevenue(gross: number, distributorPct: number, platformSharePct = 10) {
  const commission = round(gross * (distributorPct / 100));
  const afterCommission = round(gross - commission);
  const platform = round(afterCommission * (platformSharePct / 100));
  const artist = round(afterCommission - platform);
  return { gross, commission, afterCommission, platform, artist };
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

export function formatKz(n: number) {
  return new Intl.NumberFormat("pt-AO", { maximumFractionDigits: 2 }).format(n) + " Kz";
}
