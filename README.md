# DriveAway — Demo Car Rental Site

A static, zero-dependency car rental demo built with plain HTML, CSS, and vanilla JavaScript. No backend — bookings are mocked and persisted in `localStorage`.

The site is also instrumented with **[Fullstory](https://www.fullstory.com/)** following the patterns from the [Fullstory Skills Repository](https://github.com/fullstorydev/fs-skills) (page properties, element properties, analytics events, stable selectors, and privacy controls).

## Features

- Marketing landing page with hero, search, featured cars, and value props
- Browse cars with client-side filters (type, max price, transmission) and sorting
- Car detail pages with specs and features
- Multi-step mock booking flow (dates, pickup/return, extras, driver info) with live price calc
- Confirmation page reads the booking from `localStorage`
- About and Contact marketing pages
- Fully responsive, single stylesheet, CSS variables for theming

## Run locally

Because the site uses `fetch` to load `data/cars.json`, you need to serve it over HTTP (opening `index.html` directly in the browser will hit CORS).

```bash
cd car-rental-demo
python3 -m http.server 8080
# then open http://localhost:8080
```

Any other static server works too (`npx serve`, `php -S localhost:8080`, etc.).

## Deploy to GitHub Pages

### Option A — GitHub Actions (recommended)

This repo includes `.github/workflows/pages.yml` which uploads the repo and deploys it via `actions/deploy-pages` on every push to `main`. To use it:

1. Push the repo to GitHub.
2. In the repo, go to **Settings -> Pages** and set **Source** = "GitHub Actions".
3. Push to `main` — the workflow runs and the site goes live at `https://<your-username>.github.io/car-rental-demo/`.

### Option B — Zero config from a branch

1. Push to GitHub.
2. **Settings -> Pages**: **Source** = "Deploy from a branch", **Branch** = `main`, **Folder** = `/ (root)`.
3. Save. Same URL as above.

## Fullstory instrumentation

This demo follows the [Fullstory Skills Repository (FSR)](https://github.com/fullstorydev/fs-skills) and the **travel** industry guidance.

### Snippet

The Fullstory Browser snippet is included **in the `<head>` of every HTML page** with the org id placeholder `171X19`. Replace it with your real org id (e.g. `O-1ABC2D-na1`) in:

- `index.html`
- `cars.html`
- `car.html`
- `booking.html`
- `confirmation.html`
- `about.html`
- `contact.html`

A simple find-and-replace works: `171X19` -> `O-YOUR-ORG-ID`.

### Stable selectors (Individual Element Decoration)

We use the [Fullstory Data Attributes Guide](https://github.com/fullstorydev/fs-skills) convention:

- `data-section` — major page area (`header`, `hero`, `footer`, `cars-browse`, etc.)
- `data-component` — element type (`button`, `link`, `card`, `panel`, `form`, `input`, `select`)
- `data-id` — instance identifier (`book-this-car`, `filter-max-price`, `pickup-location`, etc.)
- `data-position` — position in repeated lists (car cards in the grid)
- `data-state` — element state (used where applicable)

These are stable across builds, friendly to test-automation tools, and AI-agent-friendly.

### Page properties

Every page calls `FS('setProperties', { type: 'page', properties: {...} })` with at minimum a `pageName` and any page-scoped context (vehicle id on detail/booking, filter selections on browse, etc.). See `assets/js/{home,cars,car,booking,confirmation,about,contact}.js`.

### Element properties

Car cards (`home.js`, `cars.js`) and the booking CTA panel (`car.js`) emit `data-fs-element` plus `data-fs-properties-schema` so Fullstory captures vehicle id, make, model, type, price-per-day, and transmission as typed properties on click events automatically.

### Analytics events

Travel-industry-style snake_case event names:

| Event                      | Where                              | Key properties |
|----------------------------|------------------------------------|----------------|
| `search_initiated`         | Home hero search submit            | pickup_location, pickup_date, return_date, rental_days, search_source |
| `search_results_viewed`    | Browse page when arriving with search params | pickup_location, results_count |
| `filter_applied`           | Browse filters changed             | filter_name, filter_value, results_after_filter |
| `filters_reset`            | Browse "Reset filters"             | — |
| `vehicle_viewed`           | Click on car card                  | vehicle_id, vehicle_make, vehicle_model, vehicle_type, price_per_day, list_name, position_in_list |
| `vehicle_detail_viewed`    | Detail page load                   | vehicle_id, price_per_day |
| `booking_started`          | "Book this car" click              | vehicle_id, price_per_day |
| `extra_added` / `extra_removed` | Booking extras checkboxes     | extra_type, price_per_day, vehicle_id |
| `booking_completed`        | Booking form submit                | booking_id, vehicle_id, total_price, rental_days, extras_selected, has_insurance, etc. |
| `confirmation_viewed`      | Confirmation page load             | booking_id, vehicle_id, total_price |
| `contact_form_submitted`   | Contact form submit                | topic, message_length |

### Identity

On `booking_completed` we call `FS('setIdentity', { uid: email, properties: { displayName, email } })` so the session is linked to the user. (For a demo this is fine — for a real product, prefer an internal customer id over an email.)

### Privacy

Following the [privacy controls](https://github.com/fullstorydev/fs-skills) and [travel industry skill](https://github.com/fullstorydev/fs-skills) guidance:

| Field                          | Treatment      | Rationale |
|--------------------------------|----------------|-----------|
| First/last name                | `fs-mask`      | PII — mask, structure visible |
| Email                          | `fs-mask`      | PII |
| Phone                          | `fs-mask`      | PII |
| Driver's license number        | `fs-exclude`   | Government ID — never leave device |
| Date of birth                  | `fs-exclude`   | PII; combined with name = identity risk |
| Card number / expiration / CVC | `fs-exclude`   | PCI — never capture payment data |
| Search criteria, prices, vehicle data | (default — visible) | Core analytics |
| Filters and sort selections    | (default — visible) | Core analytics |

Each privacy attribute has a brief code comment in `booking.html` and `contact.html` explaining why it's masked or excluded.

## Project structure

```
car-rental-demo/
  index.html          # Landing
  cars.html           # Browse + filters
  car.html            # Detail (?id=)
  booking.html        # Booking form (?id=)
  confirmation.html   # Mock confirmation
  about.html          # Marketing
  contact.html        # Marketing
  assets/
    css/styles.css
    js/{main,home,cars,car,booking,confirmation,about,contact}.js
  data/cars.json      # Mock inventory
  .github/workflows/pages.yml
```

## Notes

- All car images are loaded from Unsplash via URL (no binary files in the repo).
- Internal links are relative so the site works both locally and at `/car-rental-demo/` on GitHub Pages.
- This is a demo. Do not use for real reservations.
