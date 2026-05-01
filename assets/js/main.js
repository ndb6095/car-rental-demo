// Shared utilities for all pages.
// Includes small helpers + Fullstory wrappers that no-op safely if FS isn't loaded
// (e.g. ad blockers, offline). The snippet itself is loaded in <head>.

export const fmt = {
  money(n) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  },
  daysBetween(start, end) {
    if (!start || !end) return 0;
    const ms = new Date(end).getTime() - new Date(start).getTime();
    return Math.max(0, Math.round(ms / 86400000));
  },
  isoToday() {
    return new Date().toISOString().slice(0, 10);
  }
};

export async function loadCars() {
  const res = await fetch('./data/cars.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error('Failed to load cars');
  return res.json();
}

// --- Fullstory helpers ---
// All wrap window.FS so they no-op if Fullstory hasn't loaded.

export function fsTrack(name, properties = {}) {
  try {
    if (typeof window.FS === 'function') {
      window.FS('trackEvent', { name, properties });
    }
  } catch (err) {
    console.warn('FS trackEvent failed', err);
  }
}

export function fsSetPage(properties = {}) {
  try {
    if (typeof window.FS === 'function') {
      window.FS('setProperties', { type: 'page', properties });
    }
  } catch (err) {
    console.warn('FS setProperties (page) failed', err);
  }
}

export function fsIdentify(uid, properties = {}) {
  try {
    if (typeof window.FS === 'function') {
      window.FS('setIdentity', { uid, properties });
    }
  } catch (err) {
    console.warn('FS setIdentity failed', err);
  }
}

// --- Shared DOM wiring ---

function setFooterYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
}

function wireHeroSearch() {
  // Used on the home page only.
  const form = document.getElementById('hero-search');
  if (!form) return;

  // Sensible default: pickup tomorrow, return three days later.
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 86400000);
  const inFour = new Date(today.getTime() + 86400000 * 4);
  const fmtDate = (d) => d.toISOString().slice(0, 10);
  form.querySelector('#hero-pickup-date').value = fmtDate(tomorrow);
  form.querySelector('#hero-return-date').value = fmtDate(inFour);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const pickup = data.get('pickup');
    const pickupDate = data.get('pickupDate');
    const returnDate = data.get('returnDate');

    fsTrack('search_initiated', {
      pickup_location: pickup,
      pickup_date: pickupDate,
      return_date: returnDate,
      rental_days: fmt.daysBetween(pickupDate, returnDate),
      search_source: 'home_hero'
    });

    const params = new URLSearchParams({
      pickup,
      pickupDate,
      returnDate
    });
    window.location.href = `./cars.html?${params.toString()}`;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setFooterYear();
  wireHeroSearch();
});
