import { fmt, loadCars, fsSetPage, fsTrack } from './main.js';

fsSetPage({
  pageName: 'Home',
  page_type: 'marketing'
});

const FEATURED_IDS = ['c5', 'c6', 'c4'];

function renderCard(car, position) {
  const tags = (car.features || []).slice(0, 3).join(',');
  return `
    <a class="car-card" href="./car.html?id=${encodeURIComponent(car.id)}"
       data-component="card"
       data-id="${car.id}"
       data-position="${position}"
       data-fs-element="Featured Car Card"
       data-car-id="${car.id}"
       data-car-make="${car.make}"
       data-car-model="${car.model}"
       data-vehicle-type="${car.type}"
       data-price-per-day="${car.pricePerDay}"
       data-transmission="${car.transmission}"
       data-fs-properties-schema='${JSON.stringify({
         "data-car-id": { "type": "str", "name": "vehicle_id" },
         "data-car-make": { "type": "str", "name": "vehicle_make" },
         "data-car-model": { "type": "str", "name": "vehicle_model" },
         "data-vehicle-type": { "type": "str", "name": "vehicle_type" },
         "data-price-per-day": { "type": "real", "name": "price_per_day" },
         "data-transmission": { "type": "str", "name": "transmission" }
       })}'>
      <div class="image" style="background-image:url('${car.image}')"></div>
      <div class="body">
        <div class="type">${car.type}</div>
        <h3 class="name">${car.make} ${car.model}</h3>
        <div class="meta">${car.seats} seats · ${car.transmission} · ${car.fuel}</div>
        <div class="price-row">
          <div class="price">${fmt.money(car.pricePerDay)}<small> / day</small></div>
          <span class="tag">View</span>
        </div>
      </div>
    </a>`;
}

(async function init() {
  const grid = document.getElementById('featured-cars');
  if (!grid) return;
  try {
    const cars = await loadCars();
    const featured = FEATURED_IDS
      .map(id => cars.find(c => c.id === id))
      .filter(Boolean);
    grid.innerHTML = featured.map((c, i) => renderCard(c, i + 1)).join('');

    grid.addEventListener('click', (e) => {
      const card = e.target.closest('.car-card');
      if (!card) return;
      const carId = card.dataset.carId;
      const position = Number(card.dataset.position) || null;
      fsTrack('vehicle_viewed', {
        vehicle_id: carId,
        vehicle_make: card.dataset.carMake,
        vehicle_model: card.dataset.carModel,
        vehicle_type: card.dataset.vehicleType,
        price_per_day: Number(card.dataset.pricePerDay),
        list_name: 'home_featured',
        position_in_list: position
      });
    });
  } catch (err) {
    grid.innerHTML = `<p class="empty-state">Couldn't load featured cars.</p>`;
    console.error(err);
  }
})();
