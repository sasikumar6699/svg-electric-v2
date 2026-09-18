import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number | null | undefined): string {
  const val = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(val);
}

export function formatNumberIndian(amount: number | null | undefined): string {
  const val = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(val);
}

const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
const twoDigits = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tensMultiple = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertTwoDigit(num: number): string {
  if (num === 0) return '';
  if (num < 10) return singleDigits[num];
  if (num >= 10 && num < 20) return twoDigits[num - 10];
  const tens = Math.floor(num / 10);
  const ones = num % 10;
  return (tensMultiple[tens] + (ones > 0 ? '-' + singleDigits[ones] : '')).trim();
}

function convertThreeDigit(num: number): string {
  const hundreds = Math.floor(num / 100);
  const remainder = num % 100;
  let str = '';
  if (hundreds > 0) {
    str += singleDigits[hundreds] + ' Hundred';
    if (remainder > 0) str += ' and ';
  }
  if (remainder > 0) {
    str += convertTwoDigit(remainder);
  }
  return str.trim();
}

export function numberToIndianWords(amount: number | null | undefined): string {
  if (!amount || isNaN(amount) || amount === 0) return 'Zero Rupees Only';

  const rounded = Math.round(amount * 100) / 100;
  const parts = rounded.toString().split('.');
  let integerPart = parseInt(parts[0], 10);
  const paise = parts.length > 1 ? parseInt(parts[1].padEnd(2, '0').slice(0, 2), 10) : 0;

  if (integerPart === 0 && paise > 0) {
    return convertTwoDigit(paise) + ' Paise Only';
  }

  let words = '';

  const crores = Math.floor(integerPart / 10000000);
  integerPart %= 10000000;

  const lakhs = Math.floor(integerPart / 100000);
  integerPart %= 100000;

  const thousands = Math.floor(integerPart / 1000);
  integerPart %= 1000;

  const remainder = integerPart;

  if (crores > 0) {
    words += convertTwoDigit(crores) + ' Crore ';
  }
  if (lakhs > 0) {
    words += convertTwoDigit(lakhs) + ' Lakh ';
  }
  if (thousands > 0) {
    words += convertTwoDigit(thousands) + ' Thousand ';
  }
  if (remainder > 0) {
    words += convertThreeDigit(remainder) + ' ';
  }

  words = words.trim() + ' Rupees';

  if (paise > 0) {
    words += ' and ' + convertTwoDigit(paise) + ' Paise';
  }

  return words + ' Only';
}