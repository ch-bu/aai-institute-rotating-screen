import './style.css';
import qrCodeImage from './assets/qr_code_studio.png';

const ICON_COLOR = '#46add5';
const SVG_NS = 'http://www.w3.org/2000/svg';
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
kicker.textContent = 'Unsere nächsten';

const qrWrapper = document.createElement('div');
qrWrapper.className = 'hero__qr';

const qrImage = new Image();
qrImage.src = qrCodeImage;
qrImage.alt = 'Programm als QR-Code öffnen';
qrWrapper.append(qrImage);

const title = document.createElement('h1');
title.className = 'hero__title';
title.innerHTML = 'Veranstaltungen<br>hier im aai Studio';

textGroup.append(kicker, title);
headerRow.append(textGroup, qrWrapper);
hero.append(headerRow);

const eventsSection = document.createElement('section');
eventsSection.className = 'events';

const eventsList = document.createElement('ol');
eventsList.className = 'events__list';
eventsSection.append(eventsList);

const formatDateParts = (isoDate) => {
  if (!isoDate) return { day: '--', month: '--' };
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return { day: '--', month: '--' };

  return {
    day: date.toLocaleDateString('de-DE', { day: '2-digit' }),
    month: date.toLocaleDateString('de-DE', { month: 'short' }).toUpperCase()
  };
};

const getLanguageFlag = (language = '') => {
  const normalized = language.toLowerCase();
  if (normalized.includes('deutsch') || normalized.includes('german')) return '🇩🇪';
  if (normalized.includes('engl') || normalized.includes('english')) return '🇬🇧';
  return '🌐';
};

const createLanguageIcon = (language = '') => {
  const flag = document.createElement('span');
  flag.className = 'event-card__flag';
  flag.textContent = getLanguageFlag(language);
  flag.setAttribute('aria-hidden', 'true');
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

  const line = document.createElementNS(SVG_NS, 'line');
  applyAttrs(line, { x1: 4, y1: 12, x2: 20, y2: 12 });
  applyAttrs(line, baseAttrs);
  svg.append(line);
  return svg;
};

const formatTimeWindow = ({ time, dateStart, dateEnd }) => {
  if (time?.trim()) return time.trim();
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

const renderEvents = (events = []) => {
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

const init = async () => {
  renderEvents();
  const events = await loadEvents();
  renderEvents(events);
};

root.append(hero, eventsSection);
init();
if (typeof window !== 'undefined') {
  window.addEventListener('resize', scheduleRowsUpdate, { passive: true });
}
