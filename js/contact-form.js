/**
 * Mayamak iletişim formu — /contact.php endpoint'ine JSON POST.
 * E-posta doğrulama + uluslararası telefon (ülke kodu butonu) + firma ülkesi.
 */
(function () {
  'use strict';

  var form = document.getElementById('contact-form');
  if (!form) return;

  var utils = window.MayamakCountryUtils;
  var countries = window.MayamakCountries || [];
  if (!utils || !countries.length) {
    console.error('MayamakCountries yüklenemedi.');
    return;
  }

  var submitBtn = document.getElementById('contact-submit');
  var feedback = document.getElementById('contact-feedback');
  var defaultBtnText = submitBtn ? submitBtn.textContent : '';
  var dialHidden = document.getElementById('contact-phone-dial');
  var dialBtn = document.getElementById('contact-phone-dial-btn');
  var dialMenu = document.getElementById('contact-phone-dial-menu');
  var phoneInput = document.getElementById('contact-phone');
  var companyCountry = document.getElementById('contact-company-country');
  var emailInput = document.getElementById('contact-email');

  function getLang() {
    return (document.documentElement.lang || 'tr').toLowerCase().indexOf('en') === 0 ? 'en' : 'tr';
  }

  function t(key, fallback) {
    if (window.MayamakI18n && typeof window.MayamakI18n.t === 'function') {
      return window.MayamakI18n.t(key) || fallback;
    }
    return fallback;
  }

  function getContactEndpoint() {
    var host = window.location.hostname;
    var port = window.location.port;
    if (host === '127.0.0.1' || host === 'localhost') {
      if (port === '5500' || port === '') {
        return 'http://127.0.0.1:8080/contact.php';
      }
    }
    return '/contact.php';
  }

  function showFeedback(type, message) {
    if (!feedback) return;
    feedback.hidden = false;
    feedback.className = 'contact-feedback contact-feedback--' + type;
    feedback.textContent = message;
    feedback.setAttribute('role', type === 'success' ? 'status' : 'alert');
    feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function setLoading(loading) {
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    submitBtn.textContent = loading
      ? t('contact.form.sending', 'Gönderiliyor...')
      : defaultBtnText;
  }

  function selectedPhoneCountry() {
    var iso = dialHidden ? dialHidden.value : 'TR';
    return utils.findByIso(iso) || utils.findByIso('TR');
  }

  function lengthLabel(country) {
    if (!country) return '';
    if (country.nationalMin === country.nationalMax) {
      return String(country.nationalMax);
    }
    return country.nationalMin + '-' + country.nationalMax;
  }

  function dialPrefix(country) {
    return '+' + (country ? country.dial : '90');
  }

  function getNationalDigits() {
    if (!phoneInput) return '';
    var country = selectedPhoneCountry();
    var raw = String(phoneInput.value || '').trim();

    // Kullanıcı +90... yapıştırdıysa ülke kodunu ayır
    if (raw.charAt(0) === '+' || raw.indexOf('00') === 0) {
      var parsed = utils.parsePhoneInput(raw, country.dial);
      if (parsed && parsed.country) {
        dialHidden.value = parsed.country.iso;
        refreshPhoneUi();
        return parsed.national.slice(0, parsed.country.nationalMax);
      }
    }

    return utils.stripLeadingZero(raw).slice(0, country.nationalMax);
  }

  function setNationalValue(national, caretOffset) {
    var country = selectedPhoneCountry();
    national = utils.stripLeadingZero(national).slice(0, country.nationalMax);
    phoneInput.value = national;
    phoneInput.maxLength = country.nationalMax;

    if (typeof caretOffset === 'number') {
      var pos = Math.max(0, Math.min(caretOffset, national.length));
      try {
        phoneInput.setSelectionRange(pos, pos);
      } catch (e) { /* ignore */ }
    }
  }

  function refreshPhoneUi() {
    var country = selectedPhoneCountry();
    if (!country || !phoneInput) return;

    if (dialBtn) dialBtn.textContent = dialPrefix(country);

    var national = utils.stripLeadingZero(phoneInput.value).slice(0, country.nationalMax);
    setNationalValue(national);

    phoneInput.placeholder = country.iso === 'TR'
      ? '5XXXXXXXXX'
      : 'X'.repeat(Math.min(country.nationalMax, 10));
  }

  function closeDialMenu() {
    if (!dialMenu || !dialBtn) return;
    dialMenu.hidden = true;
    dialBtn.setAttribute('aria-expanded', 'false');
  }

  function openDialMenu() {
    if (!dialMenu || !dialBtn) return;
    dialMenu.hidden = false;
    dialBtn.setAttribute('aria-expanded', 'true');
  }

  function toggleDialMenu() {
    if (!dialMenu) return;
    if (dialMenu.hidden) openDialMenu();
    else closeDialMenu();
  }

  function setPhoneCountry(iso, keepNational) {
    var country = utils.findByIso(iso);
    if (!country || !dialHidden) return;
    var national = keepNational ? getNationalDigits() : '';
    dialHidden.value = country.iso;
    if (dialBtn) dialBtn.textContent = dialPrefix(country);
    setNationalValue(national);
    refreshPhoneUi();
    closeDialMenu();
  }

  function populateDialMenu() {
    if (!dialMenu) return;
    var lang = getLang();
    dialMenu.innerHTML = '';

    var sorted = countries.slice().sort(function (a, b) {
      var na = utils.displayName(a, lang);
      var nb = utils.displayName(b, lang);
      if (a.iso === 'TR') return -1;
      if (b.iso === 'TR') return 1;
      return na.localeCompare(nb, lang === 'en' ? 'en' : 'tr');
    });

    sorted.forEach(function (c) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'phone-dial__option';
      btn.setAttribute('role', 'option');
      btn.dataset.iso = c.iso;
      btn.innerHTML =
        '<span class="phone-dial__option-flag">' + utils.flagEmoji(c.iso) + '</span>' +
        '<span class="phone-dial__option-name">' + utils.displayName(c, lang) + '</span>' +
        '<span class="phone-dial__option-code">+' + c.dial + '</span>';
      btn.addEventListener('click', function () {
        setPhoneCountry(c.iso, true);
        if (phoneInput) phoneInput.focus();
      });
      dialMenu.appendChild(btn);
    });
  }

  function populateCompanyCountry() {
    if (!companyCountry) return;
    var lang = getLang();
    var current = companyCountry.value || 'TR';
    companyCountry.innerHTML = '';
    var placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = t('contact.form.countryPlaceholder', 'Ülke seçin');
    companyCountry.appendChild(placeholder);

    var sorted = countries.slice().sort(function (a, b) {
      var na = utils.displayName(a, lang);
      var nb = utils.displayName(b, lang);
      if (a.iso === 'TR') return -1;
      if (b.iso === 'TR') return 1;
      return na.localeCompare(nb, lang === 'en' ? 'en' : 'tr');
    });
    sorted.forEach(function (c) {
      var opt = document.createElement('option');
      opt.value = c.iso;
      opt.textContent = utils.displayName(c, lang);
      companyCountry.appendChild(opt);
    });
    companyCountry.value = current || 'TR';
  }

  function onPhoneInput() {
    var country = selectedPhoneCountry();
    var raw = String(phoneInput.value || '');
    var sel = phoneInput.selectionStart || 0;

    if (raw.charAt(0) === '+' || raw.indexOf('00') === 0) {
      var parsed = utils.parsePhoneInput(raw, country.dial);
      if (parsed && parsed.country) {
        dialHidden.value = parsed.country.iso;
        if (dialBtn) dialBtn.textContent = dialPrefix(parsed.country);
        setNationalValue(parsed.national, parsed.national.length);
        refreshPhoneUi();
        return;
      }
    }

    // Sadece rakam; baştaki 0'ları temizle
    var digits = utils.digitsOnly(raw);
    var stripped = utils.stripLeadingZero(digits);
    var removedLeading = digits.length - stripped.length;
    var caret = Math.max(0, sel - removedLeading - (raw.length - digits.length));
    setNationalValue(stripped, caret);
  }

  function validateClient() {
    var firstName = ((form.querySelector('[name="first_name"]') || {}).value || '').trim();
    var lastName = ((form.querySelector('[name="last_name"]') || {}).value || '').trim();
    var email = ((form.querySelector('[name="email"]') || {}).value || '').trim();
    var companyIso = companyCountry ? companyCountry.value : '';
    var country = selectedPhoneCountry();
    var national = getNationalDigits();
    var message = ((form.querySelector('[name="message"]') || {}).value || '').trim();

    if (firstName.length < 2) {
      return t('contact.form.errFirstName', 'Ad en az 2 karakter olmalıdır.');
    }
    if (lastName.length < 2) {
      return t('contact.form.errLastName', 'Soyad en az 2 karakter olmalıdır.');
    }
    if (!utils.isValidEmail(email)) {
      return t('contact.form.errEmail', 'Geçerli bir e-posta adresi girin.');
    }
    if (!country || !utils.isValidNational(country, national)) {
      return t('contact.form.errPhoneLen', 'Telefon numarası {n} haneli olmalıdır.')
        .replace('{n}', lengthLabel(country));
    }
    if (country.nationalMin === country.nationalMax && national.length !== country.nationalMax) {
      return t('contact.form.errPhoneLen', 'Telefon numarası {n} haneli olmalıdır.')
        .replace('{n}', String(country.nationalMax));
    }
    if (!companyIso) {
      return t('contact.form.errCountry', 'Lütfen firmanın bulunduğu ülkeyi seçin.');
    }
    if (message.length < 10) {
      return t('contact.form.errMessage', 'Mesaj en az 10 karakter olmalıdır.');
    }
    return null;
  }

  function getPayload() {
    var country = selectedPhoneCountry();
    var national = getNationalDigits();
    var companyIso = companyCountry ? companyCountry.value : '';
    var company = utils.findByIso(companyIso);
    var lang = getLang();
    var firstName = ((form.querySelector('[name="first_name"]') || {}).value || '').trim();
    var lastName = ((form.querySelector('[name="last_name"]') || {}).value || '').trim();

    return {
      first_name: firstName,
      last_name: lastName,
      name: (firstName + ' ' + lastName).trim(),
      email: ((form.querySelector('[name="email"]') || {}).value || '').trim().toLowerCase(),
      phone: national,
      phone_dial: country ? country.dial : '',
      phone_country_iso: country ? country.iso : '',
      phone_country: country ? utils.displayName(country, 'tr') : '',
      phone_e164: country ? utils.formatE164(country.dial, national) : '',
      company: ((form.querySelector('[name="company"]') || {}).value || '').trim(),
      company_country_iso: companyIso,
      company_country: company ? utils.displayName(company, 'tr') : '',
      subject: ((form.querySelector('[name="subject"]') || {}).value || '').trim(),
      message: ((form.querySelector('[name="message"]') || {}).value || '').trim(),
      website: ((form.querySelector('[name="website"]') || {}).value || '').trim(),
      lang: lang
    };
  }

  if (dialBtn) {
    dialBtn.addEventListener('click', function (event) {
      event.preventDefault();
      toggleDialMenu();
    });
  }

  document.addEventListener('click', function (event) {
    if (!dialMenu || dialMenu.hidden) return;
    var dialWrap = document.querySelector('.phone-dial');
    if (dialWrap && !dialWrap.contains(event.target)) closeDialMenu();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeDialMenu();
  });

  if (phoneInput) {
    phoneInput.addEventListener('input', onPhoneInput);
    phoneInput.addEventListener('paste', function () {
      setTimeout(onPhoneInput, 0);
    });
  }

  if (emailInput) {
    emailInput.addEventListener('blur', function () {
      emailInput.value = emailInput.value.trim().toLowerCase();
    });
  }

  populateDialMenu();
  populateCompanyCountry();
  setPhoneCountry('TR', false);
  refreshPhoneUi();

  document.addEventListener('mayamak:langchange', function () {
    var phoneIso = dialHidden ? dialHidden.value : 'TR';
    var companyIso = companyCountry ? companyCountry.value : 'TR';
    populateDialMenu();
    populateCompanyCountry();
    setPhoneCountry(phoneIso, true);
    if (companyCountry) companyCountry.value = companyIso;
    refreshPhoneUi();
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    if (feedback) feedback.hidden = true;
    onPhoneInput();

    var clientError = validateClient();
    if (clientError) {
      showFeedback('error', clientError);
      return;
    }

    setLoading(true);

    fetch(getContactEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(getPayload())
    })
      .then(function (response) {
        return response.json().then(function (data) {
          return { ok: response.ok, status: response.status, data: data };
        });
      })
      .then(function (result) {
        var data = result.data || {};
        var message = data.message || t('contact.form.errorGeneric', 'Bir hata oluştu. Lütfen tekrar deneyin.');

        if (data.success) {
          showFeedback('success', message);
          form.reset();
          setPhoneCountry('TR', false);
          if (companyCountry) companyCountry.value = 'TR';
          refreshPhoneUi();
        } else {
          showFeedback('error', message);
        }
      })
      .catch(function () {
        showFeedback(
          'error',
          t('contact.form.errorNetwork', 'Bağlantı hatası. Lütfen tekrar deneyin.')
        );
      })
      .finally(function () {
        setLoading(false);
      });
  });
})();
