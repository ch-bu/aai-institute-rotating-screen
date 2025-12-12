import './style.css';
import qrCodeImage from './assets/qr_code_studio.png';

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

const upcomingEvents = [
  {
    id: 'event-1',
    title: 'Artist Talk mit Mara Klein',
    date: 'Fr, 05. Juli · 18:00',
    description: 'Einblicke in die neue Mixed-Media-Ausstellung und Raum für Fragen.'
  },
  {
    id: 'event-2',
    title: 'Audiovisueller Workshop',
    date: 'Sa, 13. Juli · 11:00',
    description: 'Gemeinsam mit dem Studio-Team zu immersiven Installationen experimentieren.'
  },
  {
    id: 'event-3',
    title: 'Open Studio & Treff',
    date: 'Mi, 17. Juli · 17:30',
    description: 'Neue Residency-Projekte kennenlernen und vernetzen.'
  }
];

const renderEvents = (events = []) => {
  const placeholder = eventsSection.querySelector('.events__empty');
  if (placeholder) {
    placeholder.remove();
  }

  eventsList.innerHTML = '';

  if (!events.length) {
    const emptyState = document.createElement('p');
    emptyState.className = 'events__empty';
    emptyState.textContent = 'Die nächsten Termine werden hier auftauchen …';
    eventsSection.append(emptyState);
    return;
  }

  events.forEach(({ id, date, title: eventTitle, description }) => {
    const card = document.createElement('li');
    card.className = 'event-card';
    card.setAttribute('data-event-id', id);

    const heading = document.createElement('div');
    heading.className = 'event-card__heading';

    const dateEl = document.createElement('p');
    dateEl.className = 'event-card__date';
    dateEl.textContent = date;

    const titleEl = document.createElement('h2');
    titleEl.className = 'event-card__title';
    titleEl.textContent = eventTitle;

    heading.append(dateEl, titleEl);

    const descriptionEl = document.createElement('p');
    descriptionEl.className = 'event-card__description';
    descriptionEl.textContent = description;

    card.append(heading, descriptionEl);
    eventsList.append(card);
  });
};

// Replace this stub with Notion-powered data hydration later on.
renderEvents(upcomingEvents);

root.append(hero, eventsSection);
