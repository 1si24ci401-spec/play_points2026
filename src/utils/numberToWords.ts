// Converts a number to Indian Currency Words (e.g. for Tally Invoices)
// Example: 1450.50 -> "Indian Rupees One Thousand Four Hundred Fifty and Fifty Paise Only"

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertTwoDigits(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ONES[n];
  const ten = Math.floor(n / 10);
  const one = n % 10;
  return TENS[ten] + (one > 0 ? '-' + ONES[one] : '');
}

function convertThreeDigits(n: number): string {
  const hundred = Math.floor(n / 100);
  const remainder = n % 100;
  let str = '';
  if (hundred > 0) {
    str += ONES[hundred] + ' Hundred';
    if (remainder > 0) str += ' and ';
  }
  if (remainder > 0) {
    str += convertTwoDigits(remainder);
  }
  return str.trim();
}

/**
 * Converts a number to Indian numbering system words (Lakhs, Crores, Thousands, Hundreds)
 */
export function numberToIndianWords(num: number, prefix: string = 'Rupees'): string {
  if (!num || isNaN(num) || num === 0) {
    return `${prefix} Zero Only`;
  }

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const integerPart = Math.floor(absNum);
  const decimalPart = Math.round((absNum - integerPart) * 100);

  if (integerPart === 0 && decimalPart === 0) {
    return `${prefix} Zero Only`;
  }

  // Indian Numbering System:
  // Crores: 10,000,000
  // Lakhs: 100,000
  // Thousands: 1,000
  // Hundreds / Units: remainder

  const crores = Math.floor(integerPart / 10000000);
  let remAfterCrores = integerPart % 10000000;

  const lakhs = Math.floor(remAfterCrores / 100000);
  let remAfterLakhs = remAfterCrores % 100000;

  const thousands = Math.floor(remAfterLakhs / 1000);
  const hundreds = remAfterLakhs % 1000;

  const parts: string[] = [];

  if (crores > 0) {
    parts.push(convertTwoDigits(crores) + ' Crore');
  }
  if (lakhs > 0) {
    parts.push(convertTwoDigits(lakhs) + ' Lakh');
  }
  if (thousands > 0) {
    parts.push(convertTwoDigits(thousands) + ' Thousand');
  }
  if (hundreds > 0) {
    parts.push(convertThreeDigits(hundreds));
  }

  let words = parts.join(' ').trim();
  if (!words) words = 'Zero';

  let result = `${prefix} ${words}`;

  if (decimalPart > 0) {
    result += ` and ${convertTwoDigits(decimalPart)} Paise`;
  }

  result += ' Only.';

  return (isNegative ? 'Minus ' : '') + result;
}
