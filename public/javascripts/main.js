var map = L.map('map').setView([36.71951, -4.42016], 14);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var carMarker = null;
var userMarker = null;
var watchId = null;
var parkTime = null;

var btnPark = document.getElementById('btn-park');
var btnFinish = document.getElementById('btn-finish');
var status = document.getElementById('status');
var info = document.getElementById('info');
var distance = document.getElementById('distance');
var time = document.getElementById('time');

btnPark.addEventListener('click', () => {
    navigator.geolocation.getCurrentPosition((position) => {
        var lat = position.coords.latitude;
        var lng = position.coords.longitude;

        localStorage.setItem('car-location', JSON.stringify({ lat, lng }));
        parkTime = new Date();
        localStorage.setItem('park-time', parkTime.toISOString());

        if (carMarker) map.removeLayer(carMarker);
        carMarker = L.marker([lat, lng]).addTo(map);
        carMarker.bindPopup('🅿 Tu coche está aquí').openPopup();
        map.setView([lat, lng], 16); 

        status.className = 'alert alert-success';
        status.textContent = 'Aparcamiento guardado.';
        btnPark.classList.add('d-none');
        btnFinish.classList.remove('d-none');
        info.classList.remove('d-none');

        startTracking();
    }, () => {
        Swal.fire({ icon: 'error',  title: 'Error', text: 'No se pudo obtener tu ubicación.' });
    });
});

function startTracking() {
    watchId = navigator.geolocation.watchPosition((position) => {
        var lat = position.coords.latitude;
        var lng = position.coords.longitude;

        if (userMarker) map.removeLayer(userMarker);
        userMarker = L.marker([lat, lng], {
            icon: L.divIcon({ className: '', html: '📍', iconSize: [30, 30] })
        }).addTo(map);

        var car = JSON.parse(localStorage.getItem('car-location'));
        if (car) {
            var meters = map.distance([lat, lng], [car.lat, car.lng]);
            distance.textContent = meters > 1000 ? (meters / 1000).toFixed(2) + 'km': Math.round(meters) + ' m';
        }

        var saved = localStorage.getItem('park-time');
        if (saved)  {
            var mins = Math.floor((new Date() - new Date(saved)) / 60000);
            time.textContent = mins + ' min';
        }
    });
}

btnFinish.addEventListener('click', () => {
    Swal.fire({
        title: '¿Finalizar aparcamiento?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, finalizar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            if (watchId) navigator.geolocation.clearWatch(watchId);

            var car = JSON.parse(localStorage.getItem('car-location'));
            var saved = localStorage.getItem('park-time');
            if (car && saved) {
                var endTime = new Date().toISOString();
                var duration = Math.floor((new Date() - new Date(saved)) / 60000);
                fetch('/api/parking', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        lat: car.lat,
                        lng: car.lng,
                        address: '',
                        start_time: saved,
                        end_time: endTime,
                        duration
                    })
                });
            }

            if (carMarker) map.removeLayer(carMarker);
            if (userMarker) map.removeLayer(userMarker);
            carMarker = null;
            userMarker = null;

            localStorage.removeItem('car-location');
            localStorage.removeItem('park-time');

            status.className = 'alert alert-secondary';
            status.textContent = 'No hay aparcamiento activo.';
            btnPark.classList.remove('d-none');
            btnFinish.classList.add('d-none');
            info.classList.add('d-none');
            distance.textContent = '--';
            time.textContent = '--';
        }
    });
});

var savedCar = JSON.parse(localStorage.getItem('car-location'));
if (savedCar) {
    carMarker = L.marker([savedCar.lat, savedCar.lng]).addTo(map);
    carMarker.bindPopup('🅿 Tu coche está aquí').openPopup();
    map.setView([savedCar.lat, savedCar.lng], 16);

    status.className = 'alert alert-success';
    status.textContent = 'Aparcamiento guardado.';
    btnPark.classList.add('d-none');
    btnFinish.classList.remove('d-none');
    info.classList.remove('d-none');

    startTracking();
}