document.addEventListener('DOMContentLoaded', function () {
    let precioPorKm;
    let montoMinimo;

    function actualizarPreciosPorVehiculo() {

        var fechaHoy = new Date().toISOString().substring(0, 10);
        document.getElementById('fechaEnvio').value = fechaHoy;

        const tipoVehiculo = document.getElementById('tipoVehiculo').value;
        switch (tipoVehiculo) {
            case 'Camión 3 Ton':
                precioPorKm = 1500;
                montoMinimo = 25000;
                break;
            case 'Camión 5 Ton +':
                precioPorKm = 3000;
                montoMinimo = 50000;
                break;
            case 'Plataforma 3 Ton':
                precioPorKm = 2000;
                montoMinimo = 30000;
                break;    
            case 'Plataforma 5 Ton +':
                precioPorKm = 3000;
                montoMinimo = 50000;
                break;
            case 'Vagoneta':
                precioPorKm = 3000;
                montoMinimo = 50000;
                break;
            default:
                precioPorKm = 3000;  // Precio por defecto para cualquier tipo no especificado
                montoMinimo = 15000;
        }
    }
    

    document.getElementById('tipoVehiculo').addEventListener('change', function() {
        actualizarPreciosPorVehiculo();
        calcularDistanciaYPrecio();
    });

    // Cargar datos de provincias, cantones y distritos
    fetch('/provincias-cantones-dsitritos.json')
        .then(response => response.json())
        .then(data => {
            if (data && data.provincias) {
                const provincias = Object.values(data.provincias);
                const selectProvincia = document.getElementById('provincia');
                const selectCanton = document.getElementById('canton');
                const selectDistrito = document.getElementById('distrito');

                provincias.forEach(provincia => {
                    let option = document.createElement('option');
                    option.value = provincia.nombre;
                    option.text = provincia.nombre;
                    selectProvincia.appendChild(option);
                });

                selectProvincia.addEventListener('change', function () {
                    let provinciaSeleccionada = provincias.find(p => p.nombre === this.value);
                    let cantones = Object.values(provinciaSeleccionada.cantones);
                    selectCanton.innerHTML = '<option value="">Seleccione...</option>';
                    selectDistrito.innerHTML = '<option value="">Seleccione...</option>';

                    cantones.forEach(canton => {
                        let option = document.createElement('option');
                        option.value = canton.nombre;
                        option.text = canton.nombre;
                        selectCanton.appendChild(option);
                    });
                });

                selectCanton.addEventListener('change', function () {
                    let provinciaSeleccionada = provincias.find(p => p.nombre === selectProvincia.value);
                    let cantonSeleccionado = Object.values(provinciaSeleccionada.cantones).find(c => c.nombre === this.value);
                    let distritos = Object.values(cantonSeleccionado.distritos);
                    selectDistrito.innerHTML = '<option value="">Seleccione...</option>';

                    distritos.forEach(distrito => {
                        let option = document.createElement('option');
                        option.value = distrito;
                        option.text = distrito;
                        selectDistrito.appendChild(option);
                    });
                });
            } else {
                console.error('El formato del JSON no es válido o no contiene provincias.');
            }
        })
        .catch(error => {
            console.error('Error al cargar el JSON:', error);
        });

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
        zoom: 8,
        center: { lat: 9.748917, lng: -83.753428 } // Coordenadas de Costa Rica
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
        zoom: 8,
        center: { lat: 9.748917, lng: -83.753428 } // Coordenadas de Costa Rica
    });

    let markerDestino = new google.maps.Marker({
        map: mapDestino,
        position: mapDestino.getCenter(),
        draggable: true
    });

    // Eventos para actualizar al mover el marcador de destino
    google.maps.event.addListener(markerDestino, 'dragend', function () {
        updateAddressInput(autocompleteDestino, document.getElementById('destino'), markerDestino.getPosition());
        calcularDistanciaYPrecio();
    });

    // Actualizar campos al seleccionar una dirección del autocompletar
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
                    let distanceValue = response.rows[0].elements[0].distance.value / 1000; // en km
                    let precio = Math.round(distanceValue * precioPorKm / 1000) * 1000;

                    //validacion de precio minimo
                    precio = Math.max(precio, montoMinimo);

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

    function enviarCorreo(formData) {
        emailjs.init('YOUR_EMAILJS_USER_ID');
        emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', formData)
            .then(function(response) {
                console.log('Correo enviado con éxito!', response.status, response.text);
            }, function(error) {
                console.log('Error al enviar el correo.', error);
            });
    }
    
    function enviarWhatsApp(formData) {
        const mensaje = `Tipo de Vehículo: ${formData.tipoVehiculo}\nFecha de Envío: ${formData.fechaEnvio}\nProvincia: ${formData.provincia}\nCantón: ${formData.canton}\nDistrito: ${formData.distrito}\nOrigen: ${formData.origen}\nDestino: ${formData.destino}\nDetalle: ${formData.detalle}\nNombre: ${formData.nombre}\nTeléfono: +506${formData.telefono}\nCorreo: ${formData.correo}\nDistancia: ${formData.distancia}\nPrecio: ${formData.precio}`;
        const whatsappUrl = `https://api.whatsapp.com/send?phone=50670465000&text=${encodeURIComponent(mensaje)}`;
        window.open(whatsappUrl, '_blank');
    }

    // function enviarWhatsApp(formData) {
    //     fetch('http://localhost:3000/send-message', {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json'
    //         },
    //         body: JSON.stringify({
    //             message: `Tipo de Vehículo: ${formData.tipoVehiculo}\nFecha de Envío: ${formData.fechaEnvio}\nProvincia: ${formData.provincia}\nCantón: ${formData.canton}\nDistrito: ${formData.distrito}\nOrigen: ${formData.origen}\nDestino: ${formData.destino}\nDetalle: ${formData.detalle}\nNombre: ${formData.nombre}\nTeléfono: +506${formData.telefono}\nCorreo: ${formData.correo}\nDistancia: ${formData.distancia}\nPrecio: ${formData.precio}`,
    //             // to: 'whatsapp-group-id',
    //             to: `whatsapp:+50670465000`
    //         })
    //     })
    //     .then(response => response.json())
    //     .then(data => console.log('Respuesta del servidor:', data))
    //     .catch(error => console.error('Error enviando mensaje:', error));
    // }
    

    // Función para guardar los datos del formulario
    window.guardarDatos = function () {
        let form = document.getElementById('shipmentForm');
        if (form.checkValidity() === false) {
            form.classList.add('was-validated');
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
            provincia: document.getElementById('provincia').value,
            canton: document.getElementById('canton').value,
            distrito: document.getElementById('distrito').value,
            distancia: document.getElementById('distancia').value,
            precio: document.getElementById('precio').value,
        };

        enviarWhatsApp(formData);
        enviarCorreo(formData);

        Swal.fire({
            icon: 'success',
            title: '¡Datos guardados!',
            text: 'La información ha sido enviada y guardada exitosamente.'
        });
    
        form.reset();
        form.classList.remove('was-validated');
    };

    // Inicializar los precios por defecto
    actualizarPreciosPorVehiculo();
});