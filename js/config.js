/* Renato — store settings. Everything marked  ⚠ PLACEHOLDER  must be replaced with real data. */
window.RENATO = {
  brand: 'Renato',
  season: 'AW 26',
  defaultLang: 'hy',
  currency: '֏',

  /* Delivery & prices (⚠ PLACEHOLDER — set your real rules) */
  freeShippingFrom: 25000,          // free courier delivery in Yerevan from this subtotal
  shipping: { courier: 1500, regions: 2500, pickup: 0 },

  /* Promo codes: code -> percent off (⚠ example only) */
  promos: { WELCOME10: 10 },

  /* Contacts (⚠ PLACEHOLDER) */
  phone: '+374 00 000 000',
  whatsapp: '37400000000',          // digits only, with country code, no "+"
  telegram: 'renato_store',         // username without @
  email: 'hello@renato.example',
  instagram: 'https://instagram.com/',
  facebook: 'https://facebook.com/',
  tiktok: 'https://tiktok.com/',
  address: {
    hy: 'Երևան, Աբովյան 1 (օրինակ)',
    en: 'Yerevan, 1 Abovyan St. (example)',
    ru: 'Ереван, ул. Абовяна, 1 (пример)'
  },
  hours: {
    hy: 'Երկ–Շբթ՝ 11:00–20:00',
    en: 'Mon–Sat: 11:00–20:00',
    ru: 'Пн–Сб: 11:00–20:00'
  },

  /* Orders. There is no backend: after checkout the customer sends a ready-made
     message via WhatsApp / Telegram / email. If you have an HTTPS endpoint that accepts
     JSON (Google Apps Script, Make, Zapier, your own API) put it here and the order
     will also be POSTed automatically. */
  orderEndpoint: '',
  newsletterEndpoint: '',

  /* Visuals */
  loader: true,                      // short brand intro on first visit of a session

  /* Shows small yellow "draft text" / "illustrations are placeholders" notes on pages
     that still contain sample content. Set to false once you have replaced the texts. */
  draftNotes: true
};
