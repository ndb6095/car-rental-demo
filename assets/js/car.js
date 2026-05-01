import { fmt, loadCars, fsSetPage, fsTrack } from './main.js';

const params = new URLSearchParams(window.location.search);
const carId = params.get('id');

function render(car) {
  const features = (car.features || []).map(f => `<li>${f}</li>`).join('');
  const detail = document.getElementById('detail');

  detail.innerHTML = `
    <div>
      <div class="image" style="background-image:url('${car.image}')"></div>
      <h1 style="margin-top:1rem;">${car.make} ${car.model}</h1>
      <p class="muted">${car.year} · ${car.type} · ${car.fuel}</p>
      <p>${car.description || ''}</p>

      <h3>Specs</h3>
      <div class="specs">
        <div class="spec"><div class="label">Seats</div><div class="value">${car.seats}</div></div>
        <div class="spec"><div class="label">Doors</div><div class="value">${car.doors}</div></div>
        <div class="spec"><div class="label">Bags</div><div class="value">${car.bags}</div></div>
        <div class="spec"><div class="label">Transmission</div><div class="value">${car.transmission}</div></div>
        <div class="spec"><div class="label">Fuel</div><div class="value">${car.fuel}</div></div>
        <div class="spec"><div class="label">MPG / MPGe</div><div class="value">${car.mpg}</div></div>
      </div>

      <h3>Features</h3>
      <ul class="feature-list">${features}</ul>
    </div>

    <aside class="detail-card"
      data-component="panel"
      data-id="booking-cta"
      data-fs-element="Booking CTA"
      data-car-id="${car.id}"
      data-vehicle-type="${car.type}"
      data-price-per-day="${car.pricePerDay}"
      data-fs-properties-schema='${JSON.stringify({
        "data-car-id": { "type": "str", "name": "vehicle_id" },
        "data-vehicle-type": { "type": "str", "name": "vehicle_type" },
        "data-price-per-day": { "type": "real", "name": "price_per_day" }
      })}'>
      <div class="type" style="color:var(--color-primary);font-weight:700;font-size:0.8rem;letter-spacing:0.06em;text-transform:uppercase;">${car.type}</div>
      <h2 style="margin:0;">${car.make} ${car.model}</h2>
      <p class="muted" style="margin:0;">${car.seats} seats · ${car.transmission}</p>
      <div style="display:flex;align-items:baseline;gap:0.4rem;margin-top:0.5rem;">
        <div style="font-size:2rem;font-weight:800;">${fmt.money(car.pricePerDay)}</div>
        <div class="muted">/ day</div>
      </div>
      <a class="btn btn-primary btn-large btn-block" href="./booking.html?id=${encodeURIComponent(car.id)}"
        data-component="button" data-id="book-this-car">Book this car</a>
      <a class="btn btn-secondary btn-block" href="./cars.html"
        data-component="button" data-id="back-to-browse">Back to all cars</a>
    </aside>`;

  document.getElementById('crumb-name').textContent = `${car.make} ${car.model}`;
  document.title = `${car.make} ${car.model} — DriveAway`;

  fsSetPage({
    pageName: 'Vehicle Detail',
    page_type: 'vehicle_detail',
    vehicle_id: car.id,
    vehicle_make: car.make,
    vehicle_model: car.model,
    vehicle_type: car.type,
    price_per_day: car.pricePerDay,
    transmission: car.transmission,
    fuel: car.fuel,
    seats: car.seats
  });

  fsTrack('vehicle_detail_viewed', {
    vehicle_id: car.id,
    vehicle_make: car.make,
    vehicle_model: car.model,
    vehicle_type: car.type,
    price_per_day: car.pricePerDay
  });

  // Track outbound CTA so booking_started fires the moment a user commits.
  detail.querySelector('[data-id="book-this-car"]').addEventListener('click', () => {
    fsTrack('booking_started', {
      vehicle_id: car.id,
      vehicle_make: car.make,
      vehicle_model: car.model,
      vehicle_type: car.type,
      price_per_day: car.pricePerDay
    });
  });
}

(async function init() {
  const detail = document.getElementById('detail');
  if (!carId) {
    detail.innerHTML = `<p class="empty-state">No car selected. <a href="./cars.html">Browse all cars</a>.</p>`;
    return;
  }
  try {
    const cars = await loadCars();
    const car = cars.find(c => c.id === carId);
    if (!car) {
      detail.innerHTML = `<p class="empty-state">That car wasn't found. <a href="./cars.html">Browse all cars</a>.</p>`;
      return;
    }
    render(car);
  } catch (err) {
    detail.innerHTML = `<p class="empty-state">Couldn't load car details.</p>`;
    console.error(err);
  }
})();
