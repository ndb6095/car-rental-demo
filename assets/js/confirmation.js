import { fmt, fsSetPage, fsTrack } from './main.js';

const STORAGE_KEY = 'driveaway:booking';

(function init() {
  let booking = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) booking = JSON.parse(raw);
  } catch (err) {
    console.warn('Could not read booking', err);
  }

  const summary = document.getElementById('confirm-summary');
  const idEl = document.getElementById('confirm-id');

  if (!booking) {
    summary.innerHTML = `<p class="muted">No recent booking found. <a href="./cars.html">Browse cars</a> to make one.</p>`;
    fsSetPage({ pageName: 'Confirmation', page_type: 'confirmation', has_booking: false });
    return;
  }

  idEl.textContent = booking.bookingId;
  // Mask the displayed driver name in case the user takes a screenshot — real PII display
  // would still be tagged with fs-mask in the markup.
  const t = booking.totals || {};
  summary.innerHTML = `
    <div class="summary-row"><span>Car</span><span>${booking.car.make} ${booking.car.model}</span></div>
    <div class="summary-row"><span>Pickup</span><span>${booking.pickupLocation || '—'}</span></div>
    <div class="summary-row"><span>Pickup date</span><span>${booking.pickupDate || '—'}</span></div>
    <div class="summary-row"><span>Return</span><span>${booking.returnLocation || '—'}</span></div>
    <div class="summary-row"><span>Return date</span><span>${booking.returnDate || '—'}</span></div>
    <div class="summary-row"><span>Days</span><span>${t.days ?? '—'}</span></div>
    <div class="summary-row"><span>Driver</span><span class="fs-mask">${[booking.driver?.firstName, booking.driver?.lastName].filter(Boolean).join(' ') || '—'}</span></div>
    <div class="summary-row"><span>Email</span><span class="fs-mask">${booking.driver?.email || '—'}</span></div>
    <div class="summary-row total"><span>Total</span><span>${fmt.money(t.total ?? 0)}</span></div>
  `;

  fsSetPage({
    pageName: 'Confirmation',
    page_type: 'confirmation',
    has_booking: true,
    booking_id: booking.bookingId,
    vehicle_id: booking.car.id,
    vehicle_type: booking.car.type,
    rental_days: t.days,
    total_price: t.total
  });

  // One last conversion event for downstream analysis.
  fsTrack('confirmation_viewed', {
    booking_id: booking.bookingId,
    vehicle_id: booking.car.id,
    rental_days: t.days,
    total_price: t.total
  });
})();
