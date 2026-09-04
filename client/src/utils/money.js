export const toVndAmount = (thousandVnd) => {
  const amount = Number(thousandVnd);

  return Number.isFinite(amount) ? Math.round(amount * 1000) : 0;
};

export const formatThousandsVnd = (thousandVnd, currency = "VND") =>
  `${toVndAmount(thousandVnd).toLocaleString("vi-VN")} ${currency || ""}`.trim();
