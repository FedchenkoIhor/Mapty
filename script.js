'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coord, distance, duration) {
    this.coord = coord; //[lat, lng]
    this.distance = distance; //km
    this.duration = duration; //h
  }

  _setDiscription() {
    // prettier-ignore
    // const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${this.date.toLocaleString('en-us', {month: 'long', day: 'numeric'})}`
  }
}

class Running extends Workout {
  constructor(coord, distance, duration, cadence) {
    super(coord, distance, duration);
    this.cadence = cadence;
    this.type = 'running';
    this.calcPace();
    this._setDiscription();
  }

  calcPace() {
    this.pace = this.duration / this.distance; //min / km
  }
}

class Cycling extends Workout {
  constructor(coord, distance, duration, elevationGain) {
    super(coord, distance, duration);
    this.elevationGain = elevationGain;
    this.type = 'cycling';
    this.calcSpeed();
    this._setDiscription();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60); // km/h
  }
}

// APPLICATION
class App {
  #map;
  #mapEvent;
  #mapZoom = 13;
  #workouts = [];
  constructor() {
    // get user's position
    this._getPosition();

    // get data from locale storage
    this._getLocalStorage();

    // add events on click and change
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevetionField);
    containerWorkouts.addEventListener(
      'click',
      this._activeClickedPopup.bind(this)
    );
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Can't get you geolocation!");
        }
      );
    }
  }

  _loadMap(position) {
    // get clicked position
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoom);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.#map);
    const marker = L.marker(coords).addTo(this.#map);
    marker.bindPopup('<b>Current position</b>').openPopup();

    // CLICK OM THE MAP
    this.#map.on('click', this._showForm.bind(this));

    // load all markers from local storage
    this.#workouts.forEach(work => {
      this.#renderWorkoutMarker(work);
    });
  }

  _showForm(e) {
    this.#mapEvent = e;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    form.getElementsByClassName.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevetionField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    // check inputs for number
    const validNumber = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    // check inputs for positive value
    const validPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    // get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    let workout;
    const { lat, lng } = this.#mapEvent.latlng;

    // if workout is running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;

      // valid date
      if (
        !validNumber(distance, duration, cadence) ||
        !validPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be a positive numbers!');

      // create new instance of Running class
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // if workout is cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      // valid date
      if (
        !validNumber(distance, duration, elevation) ||
        !validPositive(distance, duration, elevation)
      )
        return alert('Inputs have to be a positive numbers!');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // add new object to workout array
    this.#workouts.push(workout);
    console.log(workout);

    // render workout object on map as a marker
    this.#renderWorkoutMarker(workout);

    // renderworkout on list
    this.#renderWorkout(workout);

    // hidde a form and clear form's fiels
    this._hideForm();

    // save data to locale storage
    this._setLocalStorage();
  }

  #renderWorkoutMarker(workout) {
    L.marker(workout.coord)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  #renderWorkout(workout) {
    let html = `
          <li class="workout workout--${workout.type}" data-id="${workout.id}">
              <h2 class="workout__title">${workout.description}</h2>
              <div class="workout__details">
                <span class="workout__icon">${
                  workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
                }</span>
                <span class="workout__value">${workout.distance}</span>
                <span class="workout__unit">km</span>
              </div>
              <div class="workout__details">
                <span class="workout__icon">⏱</span>
                <span class="workout__value">${workout.duration}</span>
                <span class="workout__unit">min</span>
              </div>
    `;

    if (workout.type === 'running') {
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
      `;
    }

    if (workout.type === 'cycling') {
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
      `;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  _activeClickedPopup(e) {
    // select clicked list element
    const htmlEl = e.target.closest('.workout');
    // check for correcting clicked
    if (!htmlEl) return;
    // get id element
    const id = htmlEl.dataset.id;
    // get object from array
    const workout = this.#workouts.find(el => el.id === id);
    // find marker on map
    this.#map.setView(workout.coord, this.#mapZoom, {
      animate: true,
      pan: { duration: 1 },
    });
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(work => {
      this.#renderWorkout(work);
    });
  }

  reset() {
    localStorage.removeItem();
  }
}

const app = new App();
