/**
 * Telefon / firma ülke listesi (bayrak emoji + alan kodu).
 * dial: uluslararası kod (ülke kodu), iso: ISO 3166-1 alpha-2
 * nationalMin / nationalMax: başındaki 0 olmadan ulusal numara uzunluğu
 */
window.MayamakCountries = [
  { iso: 'TR', dial: '90',  nameTr: 'Türkiye', nameEn: 'Turkey', nationalMin: 10, nationalMax: 10 },
  { iso: 'DE', dial: '49',  nameTr: 'Almanya', nameEn: 'Germany', nationalMin: 10, nationalMax: 11 },
  { iso: 'US', dial: '1',   nameTr: 'Amerika Birleşik Devletleri', nameEn: 'United States', nationalMin: 10, nationalMax: 10 },
  { iso: 'GB', dial: '44',  nameTr: 'Birleşik Krallık', nameEn: 'United Kingdom', nationalMin: 10, nationalMax: 10 },
  { iso: 'FR', dial: '33',  nameTr: 'Fransa', nameEn: 'France', nationalMin: 9, nationalMax: 9 },
  { iso: 'IT', dial: '39',  nameTr: 'İtalya', nameEn: 'Italy', nationalMin: 9, nationalMax: 10 },
  { iso: 'ES', dial: '34',  nameTr: 'İspanya', nameEn: 'Spain', nationalMin: 9, nationalMax: 9 },
  { iso: 'NL', dial: '31',  nameTr: 'Hollanda', nameEn: 'Netherlands', nationalMin: 9, nationalMax: 9 },
  { iso: 'BE', dial: '32',  nameTr: 'Belçika', nameEn: 'Belgium', nationalMin: 8, nationalMax: 9 },
  { iso: 'CH', dial: '41',  nameTr: 'İsviçre', nameEn: 'Switzerland', nationalMin: 9, nationalMax: 9 },
  { iso: 'AT', dial: '43',  nameTr: 'Avusturya', nameEn: 'Austria', nationalMin: 10, nationalMax: 13 },
  { iso: 'SE', dial: '46',  nameTr: 'İsveç', nameEn: 'Sweden', nationalMin: 9, nationalMax: 10 },
  { iso: 'NO', dial: '47',  nameTr: 'Norveç', nameEn: 'Norway', nationalMin: 8, nationalMax: 8 },
  { iso: 'DK', dial: '45',  nameTr: 'Danimarka', nameEn: 'Denmark', nationalMin: 8, nationalMax: 8 },
  { iso: 'FI', dial: '358', nameTr: 'Finlandiya', nameEn: 'Finland', nationalMin: 9, nationalMax: 10 },
  { iso: 'PL', dial: '48',  nameTr: 'Polonya', nameEn: 'Poland', nationalMin: 9, nationalMax: 9 },
  { iso: 'CZ', dial: '420', nameTr: 'Çekya', nameEn: 'Czechia', nationalMin: 9, nationalMax: 9 },
  { iso: 'RO', dial: '40',  nameTr: 'Romanya', nameEn: 'Romania', nationalMin: 9, nationalMax: 9 },
  { iso: 'BG', dial: '359', nameTr: 'Bulgaristan', nameEn: 'Bulgaria', nationalMin: 8, nationalMax: 9 },
  { iso: 'GR', dial: '30',  nameTr: 'Yunanistan', nameEn: 'Greece', nationalMin: 10, nationalMax: 10 },
  { iso: 'RU', dial: '7',   nameTr: 'Rusya', nameEn: 'Russia', nationalMin: 10, nationalMax: 10 },
  { iso: 'UA', dial: '380', nameTr: 'Ukrayna', nameEn: 'Ukraine', nationalMin: 9, nationalMax: 9 },
  { iso: 'AZ', dial: '994', nameTr: 'Azerbaycan', nameEn: 'Azerbaijan', nationalMin: 9, nationalMax: 9 },
  { iso: 'GE', dial: '995', nameTr: 'Gürcistan', nameEn: 'Georgia', nationalMin: 9, nationalMax: 9 },
  { iso: 'KZ', dial: '7',   nameTr: 'Kazakistan', nameEn: 'Kazakhstan', nationalMin: 10, nationalMax: 10 },
  { iso: 'IQ', dial: '964', nameTr: 'Irak', nameEn: 'Iraq', nationalMin: 10, nationalMax: 10 },
  { iso: 'IR', dial: '98',  nameTr: 'İran', nameEn: 'Iran', nationalMin: 10, nationalMax: 10 },
  { iso: 'SA', dial: '966', nameTr: 'Suudi Arabistan', nameEn: 'Saudi Arabia', nationalMin: 9, nationalMax: 9 },
  { iso: 'AE', dial: '971', nameTr: 'Birleşik Arap Emirlikleri', nameEn: 'United Arab Emirates', nationalMin: 9, nationalMax: 9 },
  { iso: 'QA', dial: '974', nameTr: 'Katar', nameEn: 'Qatar', nationalMin: 8, nationalMax: 8 },
  { iso: 'KW', dial: '965', nameTr: 'Kuveyt', nameEn: 'Kuwait', nationalMin: 8, nationalMax: 8 },
  { iso: 'BH', dial: '973', nameTr: 'Bahreyn', nameEn: 'Bahrain', nationalMin: 8, nationalMax: 8 },
  { iso: 'OM', dial: '968', nameTr: 'Umman', nameEn: 'Oman', nationalMin: 8, nationalMax: 8 },
  { iso: 'EG', dial: '20',  nameTr: 'Mısır', nameEn: 'Egypt', nationalMin: 10, nationalMax: 10 },
  { iso: 'CN', dial: '86',  nameTr: 'Çin', nameEn: 'China', nationalMin: 11, nationalMax: 11 },
  { iso: 'JP', dial: '81',  nameTr: 'Japonya', nameEn: 'Japan', nationalMin: 10, nationalMax: 11 },
  { iso: 'KR', dial: '82',  nameTr: 'Güney Kore', nameEn: 'South Korea', nationalMin: 9, nationalMax: 10 },
  { iso: 'IN', dial: '91',  nameTr: 'Hindistan', nameEn: 'India', nationalMin: 10, nationalMax: 10 },
  { iso: 'PK', dial: '92',  nameTr: 'Pakistan', nameEn: 'Pakistan', nationalMin: 10, nationalMax: 10 },
  { iso: 'BD', dial: '880', nameTr: 'Bangladeş', nameEn: 'Bangladesh', nationalMin: 10, nationalMax: 10 },
  { iso: 'SG', dial: '65',  nameTr: 'Singapur', nameEn: 'Singapore', nationalMin: 8, nationalMax: 8 },
  { iso: 'MY', dial: '60',  nameTr: 'Malezya', nameEn: 'Malaysia', nationalMin: 9, nationalMax: 10 },
  { iso: 'TH', dial: '66',  nameTr: 'Tayland', nameEn: 'Thailand', nationalMin: 9, nationalMax: 9 },
  { iso: 'ID', dial: '62',  nameTr: 'Endonezya', nameEn: 'Indonesia', nationalMin: 9, nationalMax: 12 },
  { iso: 'VN', dial: '84',  nameTr: 'Vietnam', nameEn: 'Vietnam', nationalMin: 9, nationalMax: 10 },
  { iso: 'AU', dial: '61',  nameTr: 'Avustralya', nameEn: 'Australia', nationalMin: 9, nationalMax: 9 },
  { iso: 'NZ', dial: '64',  nameTr: 'Yeni Zelanda', nameEn: 'New Zealand', nationalMin: 8, nationalMax: 10 },
  { iso: 'CA', dial: '1',   nameTr: 'Kanada', nameEn: 'Canada', nationalMin: 10, nationalMax: 10 },
  { iso: 'MX', dial: '52',  nameTr: 'Meksika', nameEn: 'Mexico', nationalMin: 10, nationalMax: 10 },
  { iso: 'BR', dial: '55',  nameTr: 'Brezilya', nameEn: 'Brazil', nationalMin: 10, nationalMax: 11 },
  { iso: 'AR', dial: '54',  nameTr: 'Arjantin', nameEn: 'Argentina', nationalMin: 10, nationalMax: 10 },
  { iso: 'ZA', dial: '27',  nameTr: 'Güney Afrika', nameEn: 'South Africa', nationalMin: 9, nationalMax: 9 },
  { iso: 'NG', dial: '234', nameTr: 'Nijerya', nameEn: 'Nigeria', nationalMin: 10, nationalMax: 10 },
  { iso: 'IL', dial: '972', nameTr: 'İsrail', nameEn: 'Israel', nationalMin: 9, nationalMax: 9 },
  { iso: 'PT', dial: '351', nameTr: 'Portekiz', nameEn: 'Portugal', nationalMin: 9, nationalMax: 9 },
  { iso: 'IE', dial: '353', nameTr: 'İrlanda', nameEn: 'Ireland', nationalMin: 9, nationalMax: 9 },
  { iso: 'HU', dial: '36',  nameTr: 'Macaristan', nameEn: 'Hungary', nationalMin: 8, nationalMax: 9 },
  { iso: 'RS', dial: '381', nameTr: 'Sırbistan', nameEn: 'Serbia', nationalMin: 8, nationalMax: 9 },
  { iso: 'HR', dial: '385', nameTr: 'Hırvatistan', nameEn: 'Croatia', nationalMin: 8, nationalMax: 9 },
  { iso: 'SI', dial: '386', nameTr: 'Slovenya', nameEn: 'Slovenia', nationalMin: 8, nationalMax: 8 },
  { iso: 'SK', dial: '421', nameTr: 'Slovakya', nameEn: 'Slovakia', nationalMin: 9, nationalMax: 9 },
  { iso: 'LT', dial: '370', nameTr: 'Litvanya', nameEn: 'Lithuania', nationalMin: 8, nationalMax: 8 },
  { iso: 'LV', dial: '371', nameTr: 'Letonya', nameEn: 'Latvia', nationalMin: 8, nationalMax: 8 },
  { iso: 'EE', dial: '372', nameTr: 'Estonya', nameEn: 'Estonia', nationalMin: 7, nationalMax: 8 }
];

window.MayamakCountryUtils = (function () {
  function flagEmoji(iso) {
    if (!iso || iso.length !== 2) return '🏳️';
    var code = iso.toUpperCase();
    return String.fromCodePoint(
      0x1F1E6 + code.charCodeAt(0) - 65,
      0x1F1E6 + code.charCodeAt(1) - 65
    );
  }

  function findByIso(iso) {
    iso = (iso || '').toUpperCase();
    for (var i = 0; i < window.MayamakCountries.length; i++) {
      if (window.MayamakCountries[i].iso === iso) return window.MayamakCountries[i];
    }
    return null;
  }

  function findByDial(dial) {
    dial = String(dial || '').replace(/\D/g, '');
    var matches = [];
    for (var i = 0; i < window.MayamakCountries.length; i++) {
      if (window.MayamakCountries[i].dial === dial) matches.push(window.MayamakCountries[i]);
    }
    if (matches.length === 0) return null;
    // Aynı dial birden fazla ülkeye aitse (1=US/CA, 7=RU/KZ) ilkini kullan
    return matches[0];
  }

  function digitsOnly(value) {
    return String(value || '').replace(/\D/g, '');
  }

  /** Ulusal numaradan baştaki 0'ı temizle */
  function stripLeadingZero(national) {
    national = digitsOnly(national);
    while (national.charAt(0) === '0') national = national.slice(1);
    return national;
  }

  /**
   * Kullanıcı yapıştırırsa +90 5xx... gibi değerleri ayrıştır.
   * @returns {{ dial: string, national: string, country: object|null }|null}
   */
  function parsePhoneInput(raw, currentDial) {
    var trimmed = String(raw || '').trim();
    if (!trimmed) return null;

    var digits = digitsOnly(trimmed);
    if (!digits) return null;

    // +90 / 0090 / 90 ile başlıyorsa ülke kodunu bul (en uzun eşleşme)
    var sorted = window.MayamakCountries.slice().sort(function (a, b) {
      return b.dial.length - a.dial.length;
    });

    if (trimmed.charAt(0) === '+' || trimmed.indexOf('00') === 0) {
      for (var i = 0; i < sorted.length; i++) {
        var d = sorted[i].dial;
        if (digits.indexOf(d) === 0) {
          return {
            dial: d,
            national: stripLeadingZero(digits.slice(d.length)),
            country: sorted[i]
          };
        }
      }
    }

    // Combobox seçili dial + ulusal numara
    return {
      dial: currentDial || '90',
      national: stripLeadingZero(digits),
      country: findByDial(currentDial || '90')
    };
  }

  function isValidEmail(email) {
    email = String(email || '').trim();
    if (!email || email.length > 150) return false;
    // Basit ama etkili RFC benzeri kontrol
    var re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    return re.test(email);
  }

  function isValidNational(country, national) {
    national = stripLeadingZero(national);
    if (!country || !national) return false;
    if (!/^\d+$/.test(national)) return false;
    if (national.length < country.nationalMin || national.length > country.nationalMax) return false;
    // Türkiye: mobil 5xx, sabit 2xx/3xx/4xx
    if (country.iso === 'TR') {
      return /^[2-5]\d{9}$/.test(national);
    }
    return true;
  }

  function formatE164(dial, national) {
    return '+' + digitsOnly(dial) + stripLeadingZero(national);
  }

  function displayName(country, lang) {
    if (!country) return '';
    return lang === 'en' ? country.nameEn : country.nameTr;
  }

  return {
    flagEmoji: flagEmoji,
    findByIso: findByIso,
    findByDial: findByDial,
    digitsOnly: digitsOnly,
    stripLeadingZero: stripLeadingZero,
    parsePhoneInput: parsePhoneInput,
    isValidEmail: isValidEmail,
    isValidNational: isValidNational,
    formatE164: formatE164,
    displayName: displayName
  };
})();
