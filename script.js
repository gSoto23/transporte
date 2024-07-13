document.addEventListener('DOMContentLoaded', function () {
    let precioPorKm = 3000;
    let montoMinimo = 15000;

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
        const mensaje = `Nombre: ${formData.nombre}\nTeléfono: ${formData.telefono}\nCorreo: ${formData.correo}\nFecha de Envío: ${formData.fechaEnvio}\nOrigen: ${formData.origen}\nDestino: ${formData.destino}\nTipo de Vehículo: ${formData.tipoVehiculo}\nDetalle: ${formData.detalle}\nProvincia: ${formData.provincia}\nCantón: ${formData.canton}\nDistrito: ${formData.distrito}\nDistancia: ${formData.distancia}\nPrecio: ${formData.precio}`;
        const whatsappUrl = `https://api.whatsapp.com/send?phone=50670465000&text=${encodeURIComponent(mensaje)}`;
        window.open(whatsappUrl, '_blank');
    }

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
            origen: document.getElementById('origen').value,
            destino: document.getElementById('destino').value,
            tipoVehiculo: document.getElementById('tipoVehiculo').value,
            detalle: document.getElementById('detalle').value,
            provincia: document.getElementById('provincia').value,
            canton: document.getElementById('canton').value,
            distrito: document.getElementById('distrito').value,
            distancia: document.getElementById('distancia').value,
            precio: document.getElementById('precio').value,
        };

        enviarCorreo(formData);
        enviarWhatsApp(formData);

        Swal.fire({
            icon: 'success',
            title: '¡Datos guardados!',
            text: 'La información ha sido enviada y guardada exitosamente.'
        });
    
        form.reset();
        form.classList.remove('was-validated');
    };
    
});
