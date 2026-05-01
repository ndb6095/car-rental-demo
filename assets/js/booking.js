import { fmt, loadCars, fsSetPage, fsTrack, fsIdentify } from './main.js';

const TAX_RATE = 0.12;
const STORAGE_KEY = 'driveaway:booking';

const params = new URLSearchParams(window.location.search);
const carId = params.get('id');

const state = {
  car: null,
  pickupDate: '',
  returnDate: '',
  pickupLocation: '',
  returnLocation: '',
  extras: {} // { insurance: 14.99, ... }
};

function setDefaults() {
  const tomorrow = new Date(Date.now() + 86400000);
  const inFour = new Date(Date.now() + 86400000 * 4);
  document.getElementById('pickup-date').value = tomorrow.toISOString().slice(0, 10);
  document.getElementById('return-date').value = inFour.toISOString().slice(0, 10);
  state.pickupDate = document.getElementById('pickup-date').value;
  state.returnDate = document.getElementById('return-date').value;
}

function calcTotals() {
  const days = fmt.daysBetween(state.pickupDate, state.returnDate);
  const daily = state.car ? state.car.pricePerDay : 0;
  const subtotal = daily * days;
  const extrasPerDay = Object.values(state.extras).reduce((s, v) => s + v, 0);
  const extrasTotal = extrasPerDay * days;
  const taxes = (subtotal + extrasTotal) * TAX_RATE;
  const total = subtotal + extrasTotal + taxes;
  return { days, daily, subtotal, extrasTotal, taxes, total };
}

function renderSummary() {
  if (!state.car) return;
  const t = calcTotals();
  document.getElementById('summary-car-name').textContent = `${state.car.make} ${state.car.model}`;
  document.getElementById('summary-car-meta').textContent = `${state.car.type} · ${state.car.seats} seats · ${state.car.transmission}`;
  document.getElementById('summary-car-image').style.backgroundImage = `url('${state.car.image}')`;
  document.getElementById('summary-daily').textContent = fmt.money(t.daily);
  document.getElementById('summary-days').textContent = t.days;
  document.getElementById('summary-subtotal').textContent = fmt.money(t.subtotal);
  document.getElementById('summary-extras').textContent = fmt.money(t.extrasTotal);
  document.getElementById('summary-taxes').textContent = fmt.money(t.taxes);
  document.getElementById('summary-total').textContent = fmt.money(t.total);
}

function wireForm() {
  document.getElementById('pickup-date').addEventListener('change', (e) => {
    state.pickupDate = e.target.value;
    renderSummary();
  });
  document.getElementById('return-date').addEventListener('change', (e) => {
    state.returnDate = e.target.value;
    renderSummary();
  });
  document.getElementById('pickup-location').addEventListener('change', (e) => {
    state.pickupLocation = e.target.value;
  });
  document.getElementById('return-location').addEventListener('change', (e) => {
    state.returnLocation = e.target.value;
  });

  document.querySelectorAll('input[name="extras"]').forEach((cb) => {
    cb.addEventListener('change', () => {
      const value = cb.value;
      const price = Number(cb.dataset.price);
      if (cb.checked) {
        state.extras[value] = price;
        fsTrack('extra_added', {
          extra_type: value,
          price_per_day: price,
          vehicle_id: state.car?.id
        });
      } else {
        delete state.extras[value];
        fsTrack('extra_removed', {
          extra_type: value,
          vehicle_id: state.car?.id
        });
      }
      renderSummary();
    });
  });

  document.getElementById('booking-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!e.target.reportValidity()) return;
    if (!state.car) return;

    const t = calcTotals();
    const data = new FormData(e.target);
    const bookingId = `DA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    // Identify the user with their email (acceptable for a demo per identify skill).
    const email = (data.get('email') || '').toString();
    const firstName = (data.get('firstName') || '').toString();
    const lastName = (data.get('lastName') || '').toString();
    if (email) {
      fsIdentify(email, {
        displayName: [firstName, lastName].filter(Boolean).join(' ') || undefined,
        email
      });
    }

    fsTrack('booking_completed', {
      booking_id: bookingId,
      vehicle_id: state.car.id,
      vehicle_make: state.car.make,
      vehicle_model: state.car.model,
      vehicle_type: state.car.type,
      pickup_location: state.pickupLocation,
      return_location: state.returnLocation === 'Same as pickup' ? state.pickupLocation : state.returnLocation,
      pickup_date: state.pickupDate,
      return_date: state.returnDate,
      rental_days: t.days,
      base_price: t.subtotal,
      ancillary_revenue: t.extrasTotal,
      taxes_fees: t.taxes,
      total_price: t.total,
      extras_selected: Object.keys(state.extras),
      has_insurance: 'insurance' in state.extras,
      has_gps: 'gps' in state.extras,
      has_child_seat: 'child_seat' in state.extras,
      has_additional_driver: 'additional_driver' in state.extras
    });

    // Persist a NON-SENSITIVE snapshot of the booking for the confirmation page.
    // Deliberately exclude license, DOB, and any payment fields.
    const booking = {
      bookingId,
      car: state.car,
      pickupDate: state.pickupDate,
      returnDate: state.returnDate,
      pickupLocation: state.pickupLocation,
      returnLocation: state.returnLocation === 'Same as pickup' ? state.pickupLocation : state.returnLocation,
      extras: state.extras,
      driver: {
        firstName,
        lastName,
        email,
        phone: (data.get('phone') || '').toString()
      },
      totals: t
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
    } catch (err) {
      console.warn('Could not save booking', err);
    }

    window.location.href = './confirmation.html';
  });
}

(async function init() {
  if (!carId) {
    document.getElementById('booking-grid').innerHTML =
      `<p class="empty-state">No car selected. <a href="./cars.html">Browse cars</a>.</p>`;
    return;
  }
  try {
    const cars = await loadCars();
    state.car = cars.find(c => c.id === carId);
    if (!state.car) {
      document.getElementById('booking-grid').innerHTML =
        `<p class="empty-state">That car wasn't found. <a href="./cars.html">Browse cars</a>.</p>`;
      return;
    }
    document.getElementById('crumb-car-link').textContent = `${state.car.make} ${state.car.model}`;
    document.getElementById('crumb-car-link').href = `./car.html?id=${encodeURIComponent(state.car.id)}`;

    fsSetPage({
      pageName: 'Booking',
      page_type: 'booking_form',
      vehicle_id: state.car.id,
      vehicle_make: state.car.make,
      vehicle_model: state.car.model,
      vehicle_type: state.car.type,
      price_per_day: state.car.pricePerDay
    });

    setDefaults();
    wireForm();
    renderSummary();
  } catch (err) {
    console.error(err);
    document.getElementById('booking-grid').innerHTML =
      `<p class="empty-state">Couldn't load booking. Try again.</p>`;
  }
})();
