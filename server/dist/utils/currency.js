export function formatCurrency(value, currency = 'TRY', locale = 'tr-TR') {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
    }).format(value);
}
export function round2(value) {
    return Math.round(value * 100) / 100;
}
