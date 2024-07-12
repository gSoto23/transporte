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
        if (place.geometry) {
            markerOrigen.setPosition(place.geometry.location);
            mapOrigen.setCenter(place.geometry.location);
            calcularDistanciaYPrecio(precioPorKm);
        }
    });

    autocompleteDestino.addListener('place_changed', function () {
        let place = autocompleteDestino.getPlace();
        if (place.geometry) {
            markerDestino.setPosition(place.geometry.location);
            mapDestino.setCenter(place.geometry.location);
            calcularDistanciaYPrecio(precioPorKm);
        }
    });

    // Función para actualizar la dirección en el campo de texto
    function updateAddressInput(autocomplete, inputElement, position) {
        inputElement.value = '';
        if (position) {
            let geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location: position }, function (results, status) {
                if (status === 'OK' && results[0]) {
                    inputElement.value = results[0].formatted_address;
                }
            });
        }
    }

    // Calcular la distancia y el precio entre origen y destino
    function calcularDistanciaYPrecio(precioPorKm) {
        let origen = markerOrigen.getPosition();
        let destino = markerDestino.getPosition();

        if (origen && destino) {
            let service = new google.maps.DistanceMatrixService();
            service.getDistanceMatrix({
                origins: [origen],
                destinations: [destino],
                travelMode: 'DRIVING'
            }, function (response, status) {
                if (status === 'OK') {
                    let distanceText = response.rows[0].elements[0].distance.text;
                    let distanceValue = response.rows[0].elements[0].distance.value / 1000; // en km
                    let precio = Math.round(distanceValue * precioPorKm / 1000) * 1000;

                    document.getElementById('distancia').value = distanceText;
                    document.getElementById('precio').value = precio.toLocaleString('es-CR', {
                        style: 'currency',
                        currency: 'CRC',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                    });
                }
            });
        }
    }

    // Función para guardar los datos del formulario
    window.guardarDatos = function () {
        let form = document.getElementById('shipmentForm');
        if (form.checkValidity() === false) {
            form.classList.add('was-validated');
            return;
        }

        let nombre = document.getElementById('nombre').value;
        let fechaEnvio = document.getElementById('fechaEnvio').value;
        let telefono = document.getElementById('telefono').value;
        let correo = document.getElementById('correo').value;
        let origen = document.getElementById('origen').value;
        let destino = document.getElementById('destino').value;
        let detalle = document.getElementById('detalle').value;
        let distancia = document.getElementById('distancia').value;
        let precio = document.getElementById('precio').value;

        let datosEnvio = {
            nombre,
            fechaEnvio,
            telefono,
            correo,
            origen,
            destino,
            detalle,
            distancia,
            precio
        };

        emailjs.send('service_id', 'template_id', datosEnvio)
            .then(function (response) {
                Swal.fire('Envío Exitoso', 'Sus datos han sido enviados correctamente.', 'success');
                form.reset();
                form.classList.remove('was-validated');
                document.getElementById('distancia').value = '';
                document.getElementById('precio').value = '';
            }, function (error) {
                Swal.fire('Error', 'Hubo un problema al enviar sus datos. Por favor intente nuevamente.', 'error');
            });

        // Enviar mensaje por WhatsApp
        let whatsappMessage = `Nombre: ${nombre}\nFecha de Envío: ${fechaEnvio}\nTeléfono: ${telefono}\nCorreo: ${correo}\nOrigen: ${origen}\nDestino: ${destino}\nDetalle: ${detalle}\nDistancia: ${distancia}\nPrecio: ${precio}`;
        let whatsappURL = `https://api.whatsapp.com/send?phone=50670465000&text=${encodeURIComponent(whatsappMessage)}`;
        window.open(whatsappURL, '_blank');
    };
});
