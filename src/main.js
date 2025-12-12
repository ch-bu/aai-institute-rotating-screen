import './style.css';
import qrCodeImage from './assets/qr_code_studio.png';

const MAX_EVENTS = 6;
const normalizeBase = (base) => {
  if (!base) return '/';
  if (base === '/') return '/';
  return base.endsWith('/') ? base : `${base}/`;
};
const basePath = normalizeBase(import.meta.env.BASE_URL || '/');
const EVENTS_ENDPOINT = `${basePath}events.json`;
const root = document.querySelector('#app');

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

const getLanguageIcon = (language = '') => {
  const normalized = language.toLowerCase();
  if (normalized.includes('deutsch')) return '🇩🇪';
  if (normalized.includes('engl')) return '🇬🇧';
  if (normalized.includes('franz')) return '🇫🇷';
  if (normalized.includes('span')) return '🇪🇸';
  return '🌐';
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

    const addMetaItem = (type, label, iconSymbol) => {
      if (!label) return;
      const item = document.createElement('li');
      item.className = `event-card__meta-item event-card__meta-item--${type}`;

      const icon = document.createElement('span');
      icon.className = 'event-card__meta-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = iconSymbol;

      const text = document.createElement('span');
      text.className = 'event-card__meta-label';
      text.textContent = label;

      item.append(icon, text);
      metaList.append(item);
    };

    addMetaItem('language', event.language || 'Sprache folgt', getLanguageIcon(event.language));
    const timeLabel = formatTimeWindow(event);
    addMetaItem('time', timeLabel || 'Zeit folgt', '🕒');
    addMetaItem('price', formatPrice(event.price), '💳');

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
