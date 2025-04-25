let map = L.map('map').setView([10.77, 79.84], 13); // Your initial map center

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data © OpenStreetMap contributors'
}).addTo(map);

let fromPlace = "";
let toPlace = "";

function startListening() {
  fromPlace = "";
  toPlace = "";

  speak("Where are you starting from?");
  listenForSpeech((result1) => {
    fromPlace = result1;
    document.getElementById("destinationOutput").innerText = `From: ${fromPlace}`;

    speak("Where do you want to go?");
    listenForSpeech((result2) => {
      toPlace = result2;
      document.getElementById("destinationOutput").innerText += ` → To: ${toPlace}`;
      fetchCoordinates(fromPlace, toPlace);
    });
  });
}

function listenForSpeech(callback) {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'en-US';
  recognition.start();

  recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript;
    callback(transcript);
  };

  recognition.onerror = function (event) {
    alert("Speech recognition error: " + event.error);
  };
}

function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(utterance);
}

function fetchCoordinates(fromText, toText) {
  Promise.all([
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fromText)}`).then(res => res.json()),
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(toText)}`).then(res => res.json())
  ])
  .then(([fromData, toData]) => {
    if (!fromData.length || !toData.length) {
      alert("Location not found!");
      return;
    }

    const start = [parseFloat(fromData[0].lon), parseFloat(fromData[0].lat)];
    const end = [parseFloat(toData[0].lon), parseFloat(toData[0].lat)];

    getRoute(start, end);
  });
}

function getRoute(start, end) {
  const apiKey = '5b3ce3597851110001cf6248fbc16506d832447089fbe222827fcd2b';

  fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      coordinates: [start, end]
    })
  })
    .then(response => response.json())
    .then(data => {
      L.geoJSON(data).addTo(map);
      map.fitBounds([
        [start[1], start[0]],
        [end[1], end[0]]
      ]);
      speak("Route from " + fromPlace + " to " + toPlace + " has been displayed.");
    })
    .catch(err => console.error(err));
}
