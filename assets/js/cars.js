import { fmt, loadCars, fsSetPage, fsTrack } from './main.js';

const params = new URLSearchParams(window.location.search);
const incomingPickup = params.get('pickup') || '';
const incomingPickupDate = params.get('pickupDate') || '';
const incomingReturnDate = params.get('returnDate') || '';

const state = {
  cars: [],
  type: '',
  transmission: '',
  maxPrice: 400,
  sort: 'price-asc'
};

function renderCard(car, position) {
  return `
    <a class="car-card" href="./car.html?id=${encodeURIComponent(car.id)}"
       data-component="card"
       data-id="${car.id}"
       data-position="${position}"
       data-fs-element="Vehicle Card"
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

function applyFilters() {
  const out = state.cars
    .filter(c => !state.type || c.type === state.type)
    .filter(c => !state.transmission || c.transmission === state.transmission)
    .filter(c => c.pricePerDay <= state.maxPrice);

  switch (state.sort) {
    case 'price-asc':  out.sort((a,b) => a.pricePerDay - b.pricePerDay); break;
    case 'price-desc': out.sort((a,b) => b.pricePerDay - a.pricePerDay); break;
    case 'seats-desc': out.sort((a,b) => b.seats - a.seats); break;
  }
  return out;
}

function render() {
  const filtered = applyFilters();
  const grid = document.getElementById('cars-grid');
  const count = document.getElementById('results-count');

  count.textContent = `${filtered.length} car${filtered.length === 1 ? '' : 's'} available`;
  grid.innerHTML = filtered.length
    ? filtered.map((c, i) => renderCard(c, i + 1)).join('')
    : `<p class="empty-state">No cars match your filters. <a href="#" id="reset-link">Reset filters</a>.</p>`;

  fsSetPage({
    pageName: 'Browse Cars',
    page_type: 'vehicle_list',
    pickup_location: incomingPickup || undefined,
    pickup_date: incomingPickupDate || undefined,
    return_date: incomingReturnDate || undefined,
    filter_vehicle_type: state.type || 'all',
    filter_transmission: state.transmission || 'any',
    filter_max_price: state.maxPrice,
    sort_by: state.sort,
    results_count: filtered.length,
    has_results: filtered.length > 0
  });
}

function trackFilterChange(filterName, filterValue) {
  const filtered = applyFilters();
  fsTrack('filter_applied', {
    filter_name: filterName,
    filter_value: String(filterValue),
    results_after_filter: filtered.length,
    filter_vehicle_type: state.type || 'all',
    filter_transmission: state.transmission || 'any',
    filter_max_price: state.maxPrice,
    sort_by: state.sort
  });
}

(async function init() {
  try {
    state.cars = await loadCars();
  } catch (err) {
    document.getElementById('cars-grid').innerHTML =
      `<p class="empty-state">Couldn't load cars. Make sure you're running this over a local web server (e.g. <code>python3 -m http.server</code>).</p>`;
    return;
  }

  const typeEl = document.getElementById('filter-type');
  const transEl = document.getElementById('filter-transmission');
  const priceEl = document.getElementById('filter-price');
  const priceDisplay = document.getElementById('filter-price-display');
  const sortEl = document.getElementById('filter-sort');
  const resetBtn = document.getElementById('reset-filters');

  typeEl.addEventListener('change', () => {
    state.type = typeEl.value;
    render();
    trackFilterChange('vehicle_type', state.type || 'all');
  });
  transEl.addEventListener('change', () => {
    state.transmission = transEl.value;
    render();
    trackFilterChange('transmission', state.transmission || 'any');
  });
  priceEl.addEventListener('input', () => {
    state.maxPrice = Number(priceEl.value);
    priceDisplay.textContent = `$${state.maxPrice}`;
  });
  priceEl.addEventListener('change', () => {
    render();
    trackFilterChange('max_price', state.maxPrice);
  });
  sortEl.addEventListener('change', () => {
    state.sort = sortEl.value;
    render();
    trackFilterChange('sort_by', state.sort);
  });
  resetBtn.addEventListener('click', () => {
    state.type = ''; state.transmission = ''; state.maxPrice = 400; state.sort = 'price-asc';
    typeEl.value = ''; transEl.value = ''; priceEl.value = '400'; priceDisplay.textContent = '$400'; sortEl.value = 'price-asc';
    render();
    fsTrack('filters_reset', {});
  });

  document.getElementById('cars-grid').addEventListener('click', (e) => {
    const card = e.target.closest('.car-card');
    if (!card) return;
    fsTrack('vehicle_viewed', {
      vehicle_id: card.dataset.carId,
      vehicle_make: card.dataset.carMake,
      vehicle_model: card.dataset.carModel,
      vehicle_type: card.dataset.vehicleType,
      price_per_day: Number(card.dataset.pricePerDay),
      list_name: 'browse_results',
      position_in_list: Number(card.dataset.position) || null,
      results_count: state.cars.length
    });
  });

  // Track that the search query landed (one-shot when there's incoming search params).
  if (incomingPickup || incomingPickupDate) {
    fsTrack('search_results_viewed', {
      pickup_location: incomingPickup,
      pickup_date: incomingPickupDate,
      return_date: incomingReturnDate,
      rental_days: fmt.daysBetween(incomingPickupDate, incomingReturnDate),
      results_count: state.cars.length
    });
  }

  render();
})();
