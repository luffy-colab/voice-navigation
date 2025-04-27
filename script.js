// Add these updates to your script.js

function startListening() {
  const button = document.getElementById('listenButton');
  const spinner = document.getElementById('spinner');
  const output = document.getElementById('destinationOutput');
  
  // Add listening animation class
  button.classList.add('listening');
  button.innerHTML = '🎤 Listening...';
  
  // Disable button during operation
  button.disabled = true;
  spinner.style.display = 'block';
  output.innerHTML = '<span class="typing-effect">Listening for your command...</span>';
  
  // Clear previous route if exists
  if (routeLayer) {
    map.removeLayer(routeLayer);
    routeLayer = null;
  }
  
  fromPlace = "";
  toPlace = "";

  speak("Where are you starting from?");
  listenForSpeech((result1) => {
    fromPlace = result1.trim();
    output.innerHTML = `<span class="fade-in">From: <strong>${fromPlace}</strong></span>`;
    
    speak("Where do you want to go?");
    listenForSpeech((result2) => {
      toPlace = result2.trim();
      output.innerHTML = `<span class="fade-in">From: <strong>${fromPlace}</strong> → To: <strong>${toPlace}</strong></span>`;
      
      fetchCoordinates(fromPlace, toPlace)
        .finally(() => {
          button.classList.remove('listening');
          button.innerHTML = '🎤 Speak Destination';
          button.disabled = false;
          spinner.style.display = 'none';
        });
    }, () => {
      handleError();
      button.classList.remove('listening');
      button.innerHTML = '🎤 Speak Destination';
      button.disabled = false;
      spinner.style.display = 'none';
    });
  }, () => {
    handleError();
    button.classList.remove('listening');
    button.innerHTML = '🎤 Speak Destination';
    button.disabled = false;
    spinner.style.display = 'none';
  });
}

function addMarkers(start, end, fromText, toText) {
  // Clear previous markers
  map.eachLayer(layer => {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });

  // Custom marker icons
  const startIcon = L.divIcon({
    className: 'animated-marker start-marker',
    html: '📍',
    iconSize: [40, 40]
  });

  const endIcon = L.divIcon({
    className: 'animated-marker end-marker',
    html: '🚩',
    iconSize: [40, 40]
  });

  // Add start marker with animation
  L.marker([start[1], start[0]], { icon: startIcon }).addTo(map)
    .bindPopup(`<div class="fade-in">Start: <strong>${fromText}</strong></div>`)
    .openPopup();

  // Add end marker with animation
  L.marker([end[1], end[0]], { icon: endIcon }).addTo(map)
    .bindPopup(`<div class="fade-in">Destination: <strong>${toText}</strong></div>`);
}

function getRoute(start, end) {
  const apiKey = '5b3ce3597851110001cf6248fbc16506d832447089fbe222827fcd2b';
  const output = document.getElementById('destinationOutput');

  return fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      coordinates: [start, end],
      instructions: false
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Routing API error: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    // Remove previous route if exists
    if (routeLayer) {
      map.removeLayer(routeLayer);
    }
    
    // Add new route with animation
    routeLayer = L.geoJSON(data, {
      style: {
        color: '#3498db',
        weight: 5,
        opacity: 0.8,
        dashArray: '10, 10' // Initial dashed state for animation
      },
      onEachFeature: function(feature, layer) {
        // Animate the route drawing
        setTimeout(() => {
          layer.setStyle({
            dashArray: null // Remove dashes to complete animation
          });
        }, 100);
      }
    }).addTo(map);
    
    // Smooth zoom to route bounds
    map.flyToBounds(routeLayer.getBounds(), {
      padding: [50, 50],
      duration: 1,
      easeLinearity: 0.1
    });
    
    const distance = (data.features[0].properties.summary.distance / 1000).toFixed(1);
    const duration = (data.features[0].properties.summary.duration / 60).toFixed(0);
    
    const successMsg = `<span class="fade-in">Route found from <strong>${fromPlace}</strong> to <strong>${toPlace}</strong>.<br>Distance: ${distance} km, estimated time: ${duration} minutes.</span>`;
    output.innerHTML = successMsg;
    speak(successMsg);
  })
  .catch(err => {
    console.error("Routing error:", err);
    const errorMsg = `<span class="fade-in">Failed to get route directions. Please try again later.</span>`;
    output.innerHTML = errorMsg;
    speak(errorMsg);
    throw err;
  });
}