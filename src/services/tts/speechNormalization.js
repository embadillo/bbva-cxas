const emojiPattern = /[\p{Emoji_Presentation}\p{Extended_Pictographic}\u{FE00}-\u{FE0F}\u{200D}]/gu;

const numberWords = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte'];

function smallNumber(value) {
  const number = Number(value);
  return number <= 20 ? numberWords[number] : String(number);
}

function numberInSpanish(value) {
  const number = Math.round(Number(value));
  if (!Number.isFinite(number) || number < 0 || number > 999999999) return String(value);
  if (number <= 20) return numberWords[number];
  const units = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const tens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
  const underThousand = (n) => {
    if (n <= 20) return numberWords[n];
    if (n < 100) return `${tens[Math.floor(n / 10)]}${n % 10 ? ` y ${units[n % 10]}` : ''}`;
    if (n === 100) return 'cien';
    return `${hundreds[Math.floor(n / 100)]}${n % 100 ? ` ${underThousand(n % 100)}` : ''}`;
  };
  if (number < 1000) return underThousand(number);
  const thousands = Math.floor(number / 1000);
  const remainder = number % 1000;
  const prefix = thousands === 1 ? 'mil' : `${underThousand(thousands)} mil`;
  return remainder ? `${prefix} ${underThousand(remainder)}` : prefix;
}

function formatARS(value) {
  const amount = Number(String(value).replace(/\./g, '').replace(',', '.'));
  if (!Number.isFinite(amount)) return value;
  return `${numberInSpanish(amount)} pesos argentinos`;
}

export function normalizeForTTS(text, { locale = 'es-AR', currency = 'ARS' } = {}) {
  if (!text) return '';
  let speech = String(text)
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\\([\\`*_{}[\]()#+.!$|>~-])/g, '$1')
    .replace(emojiPattern, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  speech = speech
    .replace(/\bBBVA\b/gi, 'B B uve A')
    .replace(/\bUSD\b/gi, 'dólares')
    .replace(/\bU\$S\b/gi, 'dólares')
    .replace(/\+/g, ' plus ');

  if (locale === 'es-AR' && currency === 'ARS') {
    const amountPattern = '[0-9][0-9.\,]*';
    speech = speech.replace(new RegExp(`(?:ARS\\s*)?\\$?(${amountPattern})\\s*[-–—]\\s*(?:ARS\\s*)?\\$?(${amountPattern})`, 'gi'), (_match, lower, upper) => `aproximadamente ${formatARS(lower)} a ${formatARS(upper)}`);
    speech = speech.replace(new RegExp(`(?:ARS\\s*)?\\$(${amountPattern})`, 'gi'), (_match, amount) => formatARS(amount));
    speech = speech.replace(new RegExp(`\\bARS\\s*(${amountPattern})`, 'gi'), (_match, amount) => formatARS(amount));
    speech = speech.replace(/\b(\d+)x(?=\s+puntos?)/gi, (_match, value) => `${smallNumber(value)} veces`);
    speech = speech.replace(/\b(\d+)x(?=\s+en\b)/gi, (_match, value) => `${smallNumber(value)} veces`);
    speech = speech.replace(/(\d+),(\d+)%/g, (_match, whole, decimal) => `${numberInSpanish(whole)} coma ${numberInSpanish(decimal)} por ciento`);
    speech = speech.replace(/(\d+(?:\.\d+)?)%/g, (_match, value) => {
      const [whole, decimal] = value.split('.');
      return decimal ? `${numberInSpanish(whole)} coma ${numberInSpanish(decimal)} por ciento` : `${numberInSpanish(whole)} por ciento`;
    });
  }

  return speech.replace(/\s+/g, ' ').trim();
}

export function cleanTextForTTS(text, options) {
  return normalizeForTTS(text, options);
}
