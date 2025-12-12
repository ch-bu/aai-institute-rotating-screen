#!/usr/bin/env node
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';

const NOTION_VERSION = '2022-06-28';
const OUTPUT_FILE = path.resolve('public/events.json');
const token =
  process.env.NOTION_TOKEN ||
  process.env.NOTION_Token ||
  process.env.notion_token ||
  process.env.notionToken;
const databaseId =
  process.env.NOTION_DATABASE_ID ||
  process.env.NOTION_Database_Id ||
  process.env.NOTION_DATABASE ||
  process.env.notion_database_id;

const ensureOutputDir = async () => {
  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
};

const writeEventsFile = async (events) => {
  await ensureOutputDir();
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(events, null, 2));
};

const textFromRich = (parts = []) =>
  parts
    .map((part) => part?.plain_text ?? '')
    .join('')
    .trim();

const extractPlainText = (property) => {
  if (!property) return '';
  switch (property.type) {
    case 'title':
      return textFromRich(property.title);
    case 'rich_text':
      return textFromRich(property.rich_text);
    case 'select':
      return property.select?.name ?? '';
    case 'multi_select':
      return property.multi_select?.map((item) => item.name).join(', ');
    case 'number':
      return typeof property.number === 'number' ? String(property.number) : '';
    case 'formula': {
      const inner = property.formula;
      if (!inner) return '';
      if (inner.type === 'string') return inner.string ?? '';
      if (inner.type === 'number' && typeof inner.number === 'number') return String(inner.number);
      if (inner.type === 'date') return inner.date?.start ?? '';
      return '';
    }
    default:
      return '';
  }
};

const extractDateRange = (property) => {
  if (!property) return null;
  if (property.type === 'date') return property.date;
  if (property.type === 'formula' && property.formula?.type === 'date') {
    return property.formula.date;
  }
  return null;
};

const envPropertyNames = {
  title: process.env.NOTION_TITLE_PROPERTY,
  date: process.env.NOTION_DATE_PROPERTY,
  time: process.env.NOTION_TIME_PROPERTY,
  language: process.env.NOTION_LANGUAGE_PROPERTY,
  price: process.env.NOTION_PRICE_PROPERTY
};

const withEnvPriority = (envName, defaults) =>
  envName && envName.trim() ? [envName.trim(), ...defaults] : defaults;

const PROPERTY_GUESSES = {
  title: withEnvPriority(envPropertyNames.title, ['Title', 'Name']),
  date: withEnvPriority(envPropertyNames.date, [
    'Date of delivery',
    'Date of Delivery',
    'Date',
    'Datum',
    'Event Date'
  ]),
  time: withEnvPriority(envPropertyNames.time, ['Time', 'Uhrzeit', 'Event Time']),
  language: withEnvPriority(envPropertyNames.language, ['Language', 'Sprache', 'Lang']),
  price: withEnvPriority(envPropertyNames.price, ['Price', 'Preis', 'Kosten', 'Fee'])
};

const findProperty = (props, names = [], allowedTypes = []) => {
  const entries = Object.entries(props);
  for (const name of names) {
    const lowerName = name.toLowerCase();
    const match = entries.find(([propName]) => propName.toLowerCase() === lowerName);
    if (match) return match[1];
  }
  if (!allowedTypes.length) return undefined;
  return entries.find(([, prop]) => allowedTypes.includes(prop.type))?.[1];
};

const fetchAllPages = async () => {
  const results = [];
  let startCursor;
  let page = 1;
  do {
    const body = {
      page_size: 100
    };
    if (startCursor) body.start_cursor = startCursor;

    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'Notion-Version': NOTION_VERSION
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Notion query failed: ${response.status} ${response.statusText} -> ${errorText}`);
    }

    const payload = await response.json();
    results.push(...(payload.results ?? []));
    startCursor = payload.has_more ? payload.next_cursor : undefined;
    console.log(`[fetch-events] Pulled page ${page} (${payload.results?.length ?? 0} rows).`);
    page += 1;
  } while (startCursor && results.length < 500);

  return results;
};

const main = async () => {
  if (!token || !databaseId) {
    console.error('[fetch-events] Missing NOTION_TOKEN or NOTION_DATABASE_ID environment variables.');
    await writeEventsFile([]);
    process.exitCode = 1;
    return;
  }

  const results = await fetchAllPages();
  console.log(`[fetch-events] Retrieved ${results.length} total row(s) from Notion.`);

const ALLOWED_STATUSES = new Set(['ready', 'make ready', 'promote']);
const ALLOWED_PLACE = 'studio';
const DISALLOWED_TYPES = new Set(['event', 'internal', 'external', 'tour']);
const MAX_EVENTS = 6;

const events = results
  .map((page) => {
    const props = page.properties ?? {};
    const titleProp = findProperty(props, PROPERTY_GUESSES.title, ['title']);
    const dateProp = findProperty(props, PROPERTY_GUESSES.date, ['date', 'formula']);
    const timeProp = findProperty(props, PROPERTY_GUESSES.time, ['rich_text', 'title']);
    const languageProp = findProperty(props, PROPERTY_GUESSES.language, [
      'rich_text',
      'select',
      'multi_select'
    ]);
    const priceProp = findProperty(props, PROPERTY_GUESSES.price, ['rich_text', 'number', 'formula']);
    const placeProp = findProperty(props, ['place', 'location'], ['select']);
    const typeProp = findProperty(props, ['Type', 'type'], ['multi_select']);

    const dateRange = extractDateRange(dateProp);
    if (!dateRange?.start) return null;

    const rawTypes = typeProp?.multi_select ?? [];
    const typeTags = rawTypes
      .map((item) => item?.name?.trim())
      .filter(Boolean);

    return {
      id: page.id,
      title: extractPlainText(titleProp) || 'Unbenannte Veranstaltung',
      dateStart: dateRange.start,
      dateEnd: dateRange.end ?? null,
      language: extractPlainText(languageProp),
      time: extractPlainText(timeProp),
      price: extractPlainText(priceProp),
      status: props?.Status?.status?.name ?? null,
      place: (extractPlainText(placeProp) || '').trim(),
      typeTags
    };
  })
  .filter(Boolean);

const prioritizeEvents = (entries) => {
  const sorted = entries.sort((a, b) => new Date(a.dateStart) - new Date(b.dateStart));
  return sorted.slice(0, MAX_EVENTS);
};

const isFutureOrToday = (isoDate) => {
  if (!isoDate) return false;
  const eventDate = new Date(isoDate);
  if (Number.isNaN(eventDate.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const normalizedEvent = new Date(eventDate);
  normalizedEvent.setHours(0, 0, 0, 0);
  return normalizedEvent >= today;
};

const filteredEvents = prioritizeEvents(
  events.filter(
    (event) => {
      const status = (event.status || '').trim().toLowerCase();
      const place = (event.place || '').toLowerCase();
      const hasAllowedStatus = ALLOWED_STATUSES.has(status);
      const matchesPlace = place === ALLOWED_PLACE;
      const hasAllowedType = !event.typeTags?.some((tag) =>
        DISALLOWED_TYPES.has(tag.trim().toLowerCase())
      );
      return (
        hasAllowedStatus &&
        matchesPlace &&
        hasAllowedType &&
        isFutureOrToday(event.dateStart)
      );
    }
  )
);

const finalEvents = filteredEvents;

if (!finalEvents.length && results.length) {
  const propertyList = Object.keys(results[0]?.properties ?? {}).join(', ');
  console.warn(
    `[fetch-events] No usable events found. Available properties on first row: ${propertyList}`
  );
}

  await writeEventsFile(finalEvents);
  console.log(`[fetch-events] Stored ${finalEvents.length} event(s) in public/events.json.`);
};

main().catch(async (error) => {
  console.error('[fetch-events] Failed to load events from Notion:', error);
  await writeEventsFile([]);
  process.exitCode = 1;
});
