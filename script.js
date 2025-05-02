document.addEventListener('DOMContentLoaded', function () {
    let precioPorKm;
    let montoMinimo;
    const restOfForm = document.getElementById('restOfForm');
    const vehicleImages = document.querySelectorAll('.vehicle-image');
    const tipoVehiculoInput = document.getElementById('tipoVehiculo');
    let costoAyudante = 15000; // Costo por ayudante

    // Deshabilitar el formulario inicialmente
    restOfForm.classList.remove('enabled');

    function actualizarPreciosPorVehiculo() {
        var fechaHoy = new Date().toISOString().substring(0, 10);
        document.getElementById('fechaEnvio').value = fechaHoy;

        const tipoVehiculo = document.getElementById('tipoVehiculo').value;
        switch (tipoVehiculo) {
            case 'Camión 3 Ton':
                precioPorKm = 1500;
                montoMinimo = 25000;
                break;
            case 'Moto':
                precioPorKm = 3000;
                montoMinimo = 15000;
                break;
            case 'Mudanza':
                precioPorKm = 5000;
                montoMinimo = 30000;
                break;
            default:
                precioPorKm = 3000;
                montoMinimo = 15000;
        }
    }

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
        zoom: 12,
        center: { lat: 9.748917, lng: -83.753428 }
    });

    let markerOrigen = new google.maps.Marker({
        map: mapOrigen,
        position: mapOrigen.getCenter(),
        draggable: true
    });

    // Eventos para actualizar al mover el marcador de origen
    google.maps.event.addListener(markerOrigen, 'dragend', function () {
        updateAddressInput(autocompleteOrigen, document.getElementById('origen'), markerOrigen.getPosition());
        calcularDistanciaYPrecio();
    });

    // Mapa y marcadores para destino
    let mapDestino = new google.maps.Map(document.getElementById('mapDestino'), {
        zoom: 12,
        center: { lat: 9.748917, lng: -83.753428 }
    });

    let markerDestino = new google.maps.Marker({
        map: mapDestino,
        position: mapDestino.getCenter(),
        draggable: true
    });

    // Eventos para marcador de destino
    google.maps.event.addListener(markerDestino, 'dragend', function () {
        updateAddressInput(autocompleteDestino, document.getElementById('destino'), markerDestino.getPosition());
        calcularDistanciaYPrecio();
    });

    // Eventos de autocompletado
    autocompleteOrigen.addListener('place_changed', function () {
        let place = autocompleteOrigen.getPlace();
        if (place.geometry) {
            markerOrigen.setPosition(place.geometry.location);
            mapOrigen.setCenter(place.geometry.location);
            calcularDistanciaYPrecio();
        }
    });

    autocompleteDestino.addListener('place_changed', function () {
        let place = autocompleteDestino.getPlace();
        if (place.geometry) {
            markerDestino.setPosition(place.geometry.location);
            mapDestino.setCenter(place.geometry.location);
            calcularDistanciaYPrecio();
        }
    });

    // Función para actualizar dirección
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

    // Calcular distancia y precio
    function calcularDistanciaYPrecio() {
        actualizarPreciosPorVehiculo();
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
                    let distanceValue = response.rows[0].elements[0].distance.value / 1000;
                    let precio = Math.round(distanceValue * precioPorKm / 1000) * 1000;
                    precio = Math.max(precio, montoMinimo);

                    const ayudanteSeleccionado = document.querySelector('input[name="ayudantes"]:checked');
                    if (ayudanteSeleccionado) {
                        const numeroAyudantes = parseInt(ayudanteSeleccionado.value);
                        precio += (numeroAyudantes * costoAyudante);
                    }

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

    // Agregar eventos para los radio buttons de ayudantes
    const radioAyudantes = document.querySelectorAll('input[name="ayudantes"]');
    radioAyudantes.forEach(radio => {
        radio.addEventListener('change', calcularDistanciaYPrecio);
    });


    // Manejo de selección de vehículos
    vehicleImages.forEach(vehicle => {
        vehicle.addEventListener('click', function() {
            vehicleImages.forEach(v => v.classList.remove('selected'));
            this.classList.add('selected');
            tipoVehiculoInput.value = this.dataset.vehicle;
            this.closest('.form-group').querySelector('.invalid-feedback').style.display = 'none';
            restOfForm.classList.add('enabled');
            calcularDistanciaYPrecio();
        });
    });

    // Reset del formulario
    document.getElementById('shipmentForm').addEventListener('reset', function() {
        restOfForm.classList.remove('enabled');
        vehicleImages.forEach(v => v.classList.remove('selected'));
        tipoVehiculoInput.value = '';
    });

    // Función para guardar datos
    window.guardarDatos = function () {
        let form = document.getElementById('shipmentForm');
        if (form.checkValidity() === false) {
            form.classList.add('was-validated');
            Swal.fire({
                icon: 'error',
                title: 'Error de validación',
                text: 'Por favor, complete correctamente todos los campos requeridos del formulario.',
                confirmButtonColor: '#004085',
                confirmButtonText: 'Entendido'
            });
            return;
        }

        const formData = {
            nombre: document.getElementById('nombre').value,
            fechaEnvio: document.getElementById('fechaEnvio').value,
            telefono: document.getElementById('telefono').value,
            correo: document.getElementById('correo').value,
            origen: `https://www.waze.com/ul?ll=${markerOrigen.getPosition().lat()},${markerOrigen.getPosition().lng()}&navigate=yes`,
            destino: `https://www.waze.com/ul?ll=${markerDestino.getPosition().lat()},${markerDestino.getPosition().lng()}&navigate=yes`,
            tipoVehiculo: document.getElementById('tipoVehiculo').value,
            detalle: document.getElementById('detalle').value,
            distancia: document.getElementById('distancia').value,
            precio: document.getElementById('precio').value,
        };

        // Aquí puedes agregar la lógica para enviar los datos
        Swal.fire({
            icon: 'success',
            title: '¡Solicitud Recibida!',
            text: 'Estaremos contactandolo lo antes posible.'
        });

        form.reset();
        form.classList.remove('was-validated');
    };

    // Inicializar precios por defecto
    actualizarPreciosPorVehiculo();
});