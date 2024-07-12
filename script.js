document.addEventListener('DOMContentLoaded', function () {
    let precioPorKm = 3000;

    // Inicializar flatpickr para el campo de fecha
    flatpickr('#fechaEnvio', {
        enableTime: false,
        dateFormat: 'Y-m-d',
        minDate: 'today'
    });

    // Bootstrap form validation
    (function () {
        'use strict';
        window.addEventListener('load', function () {
            var forms = document.getElementsByClassName('needs-validation');
            var validation = Array.prototype.filter.call(forms, function (form) {
                form.addEventListener('submit', function (event) {
                    if (form.checkValidity() === false) {
                        event.preventDefault();
                        event.stopPropagation();
                    }
                    form.classList.add('was-validated');
                }, false);
            });
        }, false);
    })();

    // Inicializar Autocompletar de Google Maps
    let autocompleteOrigen = new google.maps.places.Autocomplete(document.getElementById('origen'));
    let autocompleteDestino = new google.maps.places.Autocomplete(document.getElementById('destino'));

    // Mapa y marcadores para origen
    let mapOrigen = new google.maps.Map(document.getElementById('mapOrigen'), {
        zoom: 15,
        center: { lat: 9.748917, lng: -83.753428 } // Coordenadas de Costa Rica
    });

    let markerOrigen = new google.maps.Marker({
        map: mapOrigen,
        draggable: true
    });

    // Eventos para actualizar al mover el marcador de origen
    google.maps.event.addListener(markerOrigen, 'dragend', function () {
        updateAddressInput(autocompleteOrigen, document.getElementById('origen'), markerOrigen.getPosition());
        calcularDistanciaYPrecio(precioPorKm);
    });

    // Mapa y marcadores para destino
    let mapDestino = new google.maps.Map(document.getElementById('mapDestino'), {
        zoom: 15,
        center: { lat: 9.748917, lng: -83.753428 } // Coordenadas de Costa Rica
    });

    let markerDestino = new google.maps.Marker({
        map: mapDestino,
        draggable: true
    });

    // Eventos para actualizar al mover el marcador de destino
    google.maps.event.addListener(markerDestino, 'dragend', function () {
        updateAddressInput(autocompleteDestino, document.getElementById('destino'), markerDestino.getPosition());
        calcularDistanciaYPrecio(precioPorKm);
    });

    // Actualizar campos al seleccionar una dirección del autocompletar
    autocompleteOrigen.addListener('place_changed', function () {
        let place = autocompleteOrigen.getPlace();
        if (!place.geometry) {
            return;
        }
        mapOrigen.setCenter(place.geometry.location);
        markerOrigen.setPosition(place.geometry.location);
        calcularDistanciaYPrecio(precioPorKm);
    });

    autocompleteDestino.addListener('place_changed', function () {
        let place = autocompleteDestino.getPlace();
        if (!place.geometry) {
            return;
        }
        mapDestino.setCenter(place.geometry.location);
        markerDestino.setPosition(place.geometry.location);
        calcularDistanciaYPrecio(precioPorKm);
    });
});

function guardarDatos() {
    // Obtener los valores del formulario
    let nombre = document.getElementById('nombre').value;
    let telefono = document.getElementById('telefono').value;
    let correo = document.getElementById('correo').value;
    let origen = document.getElementById('origen').value;
    let destino = document.getElementById('destino').value;
    let detalle = document.getElementById('detalle').value;
    let distancia = document.getElementById('distancia').value;
    let precio = document.getElementById('precio').value;
    let fechaEnvio = document.getElementById('fechaEnvio').value;

    // Validar el formulario
    if (!nombre || !telefono.match(/^[0-9]{10}$/) || !correo.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) || !origen || !destino || !detalle || !fechaEnvio) {
        document.getElementById('mensaje').innerHTML = '<div class="alert alert-danger" role="alert">Por favor complete todos los campos correctamente.</div>';
        return;
    }

    // Crear objeto con los datos
    let datos = {
        nombre: nombre,
        telefono: telefono,
        correo: correo,
        origen: origen,
        destino: destino,
        detalle: detalle,
        distancia: distancia,
        precio: precio,
        fechaEnvio: fechaEnvio
    };

    // Convertir a JSON
    let datosJSON = JSON.stringify(datos);

    // Mostrar mensaje de éxito y limpiar formulario
    document.getElementById('mensaje').innerHTML = '<div class="alert alert-success" role="alert">Datos guardados exitosamente.</div>';
    console.log(datosJSON);

    // Limpiar el formulario
    document.getElementById('shipmentForm').reset();
    document.getElementById('shipmentForm').classList.remove('was-validated');
    document.getElementById('distancia').value = '';
    document.getElementById('precio').value = '';
}

function calcularDistanciaYPrecio(precioPorKm) {
    let origen = document.getElementById('origen').value;
    let destino = document.getElementById('destino').value;

    if (origen && destino) {
        let directionsService = new google.maps.DirectionsService();
        let directionsRequest = {
            origin: origen,
            destination: destino,
            travelMode: google.maps.TravelMode.DRIVING
        };

        directionsService.route(directionsRequest, function (response, status) {
            if (status === google.maps.DirectionsStatus.OK) {
                let ruta = response.routes[0].legs[0];
                let distancia = ruta.distance.value / 1000; // Convertir de metros a kilómetros
                let precio = distancia * precioPorKm;

                document.getElementById('distancia').value = distancia.toFixed(2) + ' km';
                document.getElementById('precio').value = '₡' + precio.toFixed(2);
            } else {
                document.getElementById('distancia').value = 'No se pudo calcular la distancia';
                document.getElementById('precio').value = 'N/A';
            }
        });
    }
}

function updateAddressInput(autocomplete, input, latLng) {
    let geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: latLng }, function (results, status) {
        if (status === 'OK' && results[0]) {
            input.value = results[0].formatted_address;
            google.maps.event.trigger(input, 'focus', {});
            google.maps.event.trigger(input, 'keydown', { keyCode: 13 });
        }
    });
}
