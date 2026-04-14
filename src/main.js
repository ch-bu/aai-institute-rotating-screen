import './style.css';
import qrCodeImage from './assets/qr_code_studio.png';
import flagGerman from './assets/flags/de.svg';
import flagEnglish from './assets/flags/gb.svg';
import flagGlobal from './assets/flags/globe.svg';

const ICON_COLOR = '#46add5';
const SVG_NS = 'http://www.w3.org/2000/svg';
const LIVE_VIEW_REFRESH_MS = 30 * 1000;
const LIVE_VIEW_LEAD_IN_MS = 30 * 60 * 1000;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_KICKER_TEXT = 'Unsere nächsten';
const LIVE_KICKER_TEXT = 'Live Now';
const UPCOMING_KICKER_TEXT = 'Starts Soon';
const DEFAULT_TITLE_HTML = 'Veranstaltungen<br>hier im aai Studio';

const normalizeBase = (base) => {
  if (!base) return '/';
  if (base === '/') return '/';
  return base.endsWith('/') ? base : `${base}/`;
};
const basePath = normalizeBase(import.meta.env.BASE_URL || '/');
const EVENTS_ENDPOINT = `${basePath}events.json`;
const MAX_EVENTS = 6;
const root = document.querySelector('#app');
let currentEvents = [];
let resizeFrame;
let activeEvents = [];
let liveViewIntervalId;

const getColumnCount = () => {
  if (typeof window === 'undefined') return 1;
  const landscapeWide = window.matchMedia('(orientation: landscape) and (min-width: 1200px)').matches;
  return landscapeWide ? 2 : 1;
};

const updateEventRowsVariable = () => {
  if (!root) return;
  const columns = getColumnCount();
  const rows = Math.max(1, Math.ceil((currentEvents.length || 1) / columns));
  root.style.setProperty('--events-rows', rows);
};

const scheduleRowsUpdate = () => {
  if (typeof window === 'undefined') return;
  if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
  resizeFrame = window.requestAnimationFrame(updateEventRowsVariable);
};

const hero = document.createElement('header');
hero.className = 'hero';

const headerRow = document.createElement('div');
headerRow.className = 'hero__header';

const textGroup = document.createElement('div');
textGroup.className = 'hero__text';

const kicker = document.createElement('p');
kicker.className = 'hero__kicker';
kicker.textContent = DEFAULT_KICKER_TEXT;

const qrWrapper = document.createElement('div');
qrWrapper.className = 'hero__qr';

const qrImage = new Image();
qrImage.src = qrCodeImage;
qrImage.alt = 'Programm als QR-Code öffnen';
qrWrapper.append(qrImage);

const title = document.createElement('h1');
title.className = 'hero__title';
title.innerHTML = DEFAULT_TITLE_HTML;

textGroup.append(kicker, title);
headerRow.append(textGroup, qrWrapper);
hero.append(headerRow);

const eventsSection = document.createElement('section');
eventsSection.className = 'events';

const eventsList = document.createElement('ol');
eventsList.className = 'events__list';
eventsSection.append(eventsList);

const liveSection = document.createElement('section');
liveSection.className = 'live';
liveSection.hidden = true;

const liveCard = document.createElement('article');
liveCard.className = 'live-card';

const liveBadge = document.createElement('p');
liveBadge.className = 'live-card__badge';
liveBadge.textContent = LIVE_KICKER_TEXT;

const liveStatus = document.createElement('p');
liveStatus.className = 'live-card__status';

const liveTitle = document.createElement('h2');
liveTitle.className = 'live-card__title';

const liveMeta = document.createElement('div');
liveMeta.className = 'live-card__meta';

const liveFooter = document.createElement('div');
liveFooter.className = 'live-card__footer';

const liveFooterNote = document.createElement('p');
liveFooterNote.className = 'live-card__footer-note';
liveFooterNote.textContent = 'Unsere weiteren Angebote findest du über diesen QR-Code.';

const liveQr = document.createElement('div');
liveQr.className = 'live-card__qr';

const liveQrImage = new Image();
liveQrImage.src = qrCodeImage;
liveQrImage.alt = 'Programm als QR-Code öffnen';
liveQrImage.decoding = 'async';
liveQr.append(liveQrImage);

liveFooter.append(liveFooterNote, liveQr);
liveCard.append(liveBadge, liveStatus, liveTitle, liveMeta, liveFooter);
liveSection.append(liveCard);

const formatDateParts = (isoDate) => {
  if (!isoDate) return { day: '--', month: '--' };
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return { day: '--', month: '--' };

  return {
    day: date.toLocaleDateString('de-DE', { day: '2-digit' }),
    month: date.toLocaleDateString('de-DE', { month: 'short' }).toUpperCase()
  };
};

const getLanguageFlagImage = (language = '') => {
  const normalized = language.toLowerCase();
  if (normalized.includes('deutsch') || normalized.includes('german')) return flagGerman;
  if (normalized.includes('engl') || normalized.includes('english')) return flagEnglish;
  return flagGlobal;
};

const createLanguageIcon = (language = '') => {
  const flag = document.createElement('img');
  flag.className = 'event-card__flag';
  flag.src = getLanguageFlagImage(language);
  flag.alt = '';
  flag.decoding = 'async';
  return flag;
};

const createLineIcon = (type) => {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.classList.add('event-card__icon-svg');

  const baseAttrs = {
    fill: 'none',
    stroke: ICON_COLOR,
    'stroke-width': 1.8,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round'
  };

  const applyAttrs = (node, attrs) => {
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  };

  if (type === 'time') {
    const circle = document.createElementNS(SVG_NS, 'circle');
    applyAttrs(circle, { cx: 12, cy: 12, r: 8 });

    const handShort = document.createElementNS(SVG_NS, 'line');
    applyAttrs(handShort, { x1: 12, y1: 12, x2: 12, y2: 7 });

    const handLong = document.createElementNS(SVG_NS, 'line');
    applyAttrs(handLong, { x1: 12, y1: 12, x2: 16, y2: 14 });

    [circle, handShort, handLong].forEach((node) => applyAttrs(node, baseAttrs));
    svg.append(circle, handShort, handLong);
    return svg;
  }

  if (type === 'price') {
    const body = document.createElementNS(SVG_NS, 'path');
    applyAttrs(body, {
      d: 'M4 8h16v9c0 1.657-1.343 3-3 3H7c-1.657 0-3-1.343-3-3z'
    });

    const flap = document.createElementNS(SVG_NS, 'path');
    applyAttrs(flap, {
      d: 'M4 8l3-4h10l3 4'
    });

    const clasp = document.createElementNS(SVG_NS, 'circle');
    applyAttrs(clasp, { cx: 16, cy: 13, r: 1.2 });

    [body, flap, clasp].forEach((node) => applyAttrs(node, baseAttrs));
    svg.append(body, flap, clasp);
    return svg;
  }

  if (type === 'trainer') {
    const head = document.createElementNS(SVG_NS, 'circle');
    applyAttrs(head, { cx: 12, cy: 8, r: 3 });

    const shoulders = document.createElementNS(SVG_NS, 'path');
    applyAttrs(shoulders, {
      d: 'M5 19c0-3.2 3-5.2 7-5.2s7 2 7 5.2'
    });

    [head, shoulders].forEach((node) => applyAttrs(node, baseAttrs));
    svg.append(head, shoulders);
    return svg;
  }

  const line = document.createElementNS(SVG_NS, 'line');
  applyAttrs(line, { x1: 4, y1: 12, x2: 20, y2: 12 });
  applyAttrs(line, baseAttrs);
  svg.append(line);
  return svg;
};

const normalizeTimeLabel = (timeLabel = '') =>
  timeLabel
    .replace(/[–—]/g, '-')
    .replace(/\s*-\s*/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim();

const parseTimeRange = (timeLabel = '') => {
  if (!timeLabel) return null;
  const matches = [...normalizeTimeLabel(timeLabel).matchAll(/(\d{1,2})[:.](\d{2})/g)];
  if (matches.length < 2) return null;

  const toMinutes = (match) => {
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    return hours * 60 + minutes;
  };

  const startMinutes = toMinutes(matches[0]);
  const endMinutes = toMinutes(matches[1]);
  if (startMinutes === null || endMinutes === null) return null;
  return { startMinutes, endMinutes };
};

const isDateOnlyString = (value = '') => DATE_ONLY_PATTERN.test(value);

const parseEventDate = (value = '') => {
  if (!value) return null;
  if (isDateOnlyString(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const createDateWithMinutes = (baseDate, minutes) =>
  new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    Math.floor(minutes / 60),
    minutes % 60,
    0,
    0
  );

const getEventWindow = (event = {}) => {
  const startRaw = event.dateStart || '';
  if (!startRaw) return null;

  const parsedStart = parseEventDate(startRaw);
  if (!parsedStart) return null;

  const dateOnlyStart = isDateOnlyString(startRaw);
  const parsedEndRaw = parseEventDate(event.dateEnd || '');
  const dateOnlyEnd = isDateOnlyString(event.dateEnd || '');
  const timeRange = parseTimeRange(event.time || '');

  let start = parsedStart;
  let end = parsedEndRaw;

  if (dateOnlyStart && timeRange) {
    start = createDateWithMinutes(parsedStart, timeRange.startMinutes);
    end = createDateWithMinutes(parsedStart, timeRange.endMinutes);
    if (end <= start) end.setDate(end.getDate() + 1);
    return { start, end };
  }

  if (dateOnlyStart && end && dateOnlyEnd) {
    end = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999);
    return { start, end };
  }

  if (!end && timeRange) {
    end = createDateWithMinutes(parsedStart, timeRange.endMinutes);
    if (end <= start) end.setDate(end.getDate() + 1);
  }

  if (end && dateOnlyEnd) {
    end = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999);
  }

  if (!end) return null;
  return { start, end };
};

const getFeaturedEvent = (events = [], now = new Date()) =>
  (Array.isArray(events) ? events : [])
    .map((event) => {
      const window = getEventWindow(event);
      if (!window) return null;
      return {
        event,
        window,
        displayStart: new Date(window.start.getTime() - LIVE_VIEW_LEAD_IN_MS),
        isLive: now >= window.start
      };
    })
    .filter(Boolean)
    .filter(({ displayStart, window }) => now >= displayStart && now <= window.end)
    .sort((a, b) => {
      if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
      return a.isLive ? b.window.start - a.window.start : a.window.start - b.window.start;
    })[0] ?? null;

const formatTimeWindow = ({ time, dateStart, dateEnd }) => {
  if (time?.trim()) return normalizeTimeLabel(time);
  if (!dateStart) return '';
  const start = new Date(dateStart);
  if (Number.isNaN(start.getTime())) return '';

  const formatter = new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const startLabel = formatter.format(start);
  if (!dateEnd) return `${startLabel} Uhr`;

  const end = new Date(dateEnd);
  const endLabel = Number.isNaN(end.getTime()) ? null : formatter.format(end);
  return endLabel ? `${startLabel} - ${endLabel} Uhr` : `${startLabel} Uhr`;
};

const formatPrice = (price = '') => {
  if (!price) return 'Kostenlos';
  const numeric = Number(
    price
      .toString()
      .replace(/[^0-9,.-]/g, '')
      .replace(',', '.')
  );

  if (!Number.isNaN(numeric)) {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 2
    }).format(numeric);
  }

  return price;
};

const getTrainerName = (event = {}) => {
  if (typeof event.trainer === 'string' && event.trainer.trim()) return event.trainer.trim();

  const trainerField = Object.entries(event).find(
    ([key, value]) =>
      typeof value === 'string' &&
      value.trim() &&
      /(trainer|speaker|host|instructor|presenter|moderator|coach|referent)/i.test(key)
  );
  return trainerField ? trainerField[1].trim() : '';
};

const setDefaultHeroContent = () => {
  root.classList.remove('app--live');
  hero.classList.remove('hero--live');
  kicker.textContent = DEFAULT_KICKER_TEXT;
  title.innerHTML = DEFAULT_TITLE_HTML;
};

const setLiveHeroContent = (event = {}) => {
  root.classList.add('app--live');
  hero.classList.add('hero--live');
  kicker.textContent = '';
  title.textContent = event.title || 'Live Event';
};

const renderEventsList = (events = []) => {
  const placeholder = eventsSection.querySelector('.events__empty');
  if (placeholder) placeholder.remove();

  eventsList.innerHTML = '';
  currentEvents = Array.isArray(events) ? events : [];
  updateEventRowsVariable();

  if (!events.length) {
    const emptyState = document.createElement('p');
    emptyState.className = 'events__empty';
    emptyState.textContent = 'Die nächsten Termine werden hier auftauchen …';
    eventsSection.append(emptyState);
    return;
  }

  events.forEach((event, index) => {
    const card = document.createElement('li');
    card.className = 'event-card';
    card.setAttribute('data-event-id', event.id ?? `event-${index + 1}`);

    const dateBadge = document.createElement('div');
    dateBadge.className = 'event-card__date-badge';
    const dateParts = formatDateParts(event.dateStart);

    const dayEl = document.createElement('span');
    dayEl.className = 'event-card__date-day';
    dayEl.textContent = dateParts.day;

    const monthEl = document.createElement('span');
    monthEl.className = 'event-card__date-month';
    monthEl.textContent = dateParts.month;

    dateBadge.append(dayEl, monthEl);

    const body = document.createElement('div');
    body.className = 'event-card__body';

    const titleEl = document.createElement('h2');
    titleEl.className = 'event-card__title';
    titleEl.textContent = event.title ?? 'Veranstaltung';

    const metaList = document.createElement('ul');
    metaList.className = 'event-card__meta';

    const addMetaItem = (type, label, iconNode) => {
      if (!label) return;
      const item = document.createElement('li');
      item.className = `event-card__meta-item event-card__meta-item--${type}`;

      const icon = document.createElement('span');
      icon.className = `event-card__meta-icon${
        type === 'language' ? ' event-card__meta-icon--flag' : ''
      }`;
      icon.setAttribute('aria-hidden', 'true');
      if (iconNode) {
        icon.append(iconNode);
      }

      const text = document.createElement('span');
      text.className = 'event-card__meta-label';
      text.textContent = label;

      item.append(icon, text);
      metaList.append(item);
    };

    addMetaItem('language', event.language || 'Sprache folgt', createLanguageIcon(event.language));
    const timeLabel = formatTimeWindow(event);
    addMetaItem('time', timeLabel || 'Zeit folgt', createLineIcon('time'));
    addMetaItem('price', formatPrice(event.price), createLineIcon('price'));

    body.append(titleEl, metaList);
    card.append(dateBadge, body);
    eventsList.append(card);
  });
};

const renderLiveEvent = ({ event = {}, isLive = false } = {}) => {
  setLiveHeroContent(event);
  liveBadge.textContent = isLive ? LIVE_KICKER_TEXT : UPCOMING_KICKER_TEXT;
  liveStatus.textContent = isLive
    ? 'Diese Veranstaltung findet gerade hier im aai Studio statt.'
    : 'Diese Veranstaltung startet in Kürze hier im aai Studio.';
  liveTitle.textContent = event.title || 'Live Event';

  liveMeta.innerHTML = '';

  const addLiveMetaItem = (label, value, iconNode, isFlag = false) => {
    const item = document.createElement('div');
    item.className = 'live-card__meta-item';

    const labelEl = document.createElement('p');
    labelEl.className = 'live-card__meta-label';
    labelEl.textContent = label;

    const valueRow = document.createElement('div');
    valueRow.className = 'live-card__meta-value';

    const valueEl = document.createElement('p');
    valueEl.className = 'live-card__meta-text';
    valueEl.textContent = value;

    if (iconNode) {
      valueRow.classList.add('live-card__meta-value--with-icon');
      const icon = document.createElement('span');
      icon.className = `live-card__meta-icon${isFlag ? ' live-card__meta-icon--flag' : ''}`;
      icon.setAttribute('aria-hidden', 'true');
      icon.append(iconNode);
      valueRow.append(icon);
    }

    valueRow.append(valueEl);
    item.append(labelEl, valueRow);
    liveMeta.append(item);
  };

  addLiveMetaItem('Zeit', formatTimeWindow(event) || 'Zeit folgt', null);
  addLiveMetaItem('Sprache', event.language || 'Sprache folgt', createLanguageIcon(event.language), true);
  addLiveMetaItem('Trainer', getTrainerName(event) || 'Trainer folgt', null);

  liveSection.hidden = false;
  eventsSection.hidden = true;
};

const renderScreen = (events = []) => {
  const normalizedEvents = Array.isArray(events) ? events : [];
  const liveEvent = getFeaturedEvent(normalizedEvents);

  if (liveEvent) {
    renderLiveEvent(liveEvent);
    return;
  }

  setDefaultHeroContent();
  liveSection.hidden = true;
  eventsSection.hidden = false;
  renderEventsList(normalizedEvents);
};

const loadEvents = async () => {
  try {
    const response = await fetch(`${EVENTS_ENDPOINT}?t=${Date.now()}`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${EVENTS_ENDPOINT}: ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) return [];
    return data.slice(0, MAX_EVENTS);
  } catch (error) {
    console.error('[events] Unable to load events.json', error);
    return [];
  }
};

const startLiveViewTicker = () => {
  if (typeof window === 'undefined') return;
  if (liveViewIntervalId) window.clearInterval(liveViewIntervalId);
  liveViewIntervalId = window.setInterval(() => {
    renderScreen(activeEvents);
  }, LIVE_VIEW_REFRESH_MS);
};

const init = async () => {
  renderEventsList();
  const events = await loadEvents();
  activeEvents = events;
  renderScreen(activeEvents);
  startLiveViewTicker();
};

root.append(hero, liveSection, eventsSection);
init();
if (typeof window !== 'undefined') {
  window.addEventListener('resize', scheduleRowsUpdate, { passive: true });
}
