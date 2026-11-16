// Carte OpenStreetMap (Leaflet) lel WebView: nafs el logique mta3 Flutter (map_widgets.dart)
export const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TUNIS_CENTER = { latitude: 36.8065, longitude: 10.1815 };

type Point = { latitude: number; longitude: number };

type Options = {
  pick: boolean; // true = el user ynajjem y7ott el épingle (LocationPicker)
  center: Point;
  zoom: number;
  point?: Point | null; // épingle initiale
  minZoom?: number;
  maxZoom?: number;
};

export function buildMapHtml(o: Options): string {
  const cfg = JSON.stringify({
    pick: o.pick,
    lat: o.center.latitude,
    lng: o.center.longitude,
    zoom: o.zoom,
    point: o.point ? [o.point.latitude, o.point.longitude] : null,
    minZoom: o.minZoom ?? 3,
    maxZoom: o.maxZoom ?? 19,
    tile: OSM_TILE_URL,
  });

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"/>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; background: #E5F1F5; }
  .leaflet-control-attribution { font-size: 10px; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var CFG = ${cfg};

  function post(obj) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(obj));
  }

  if (typeof L === 'undefined') {
    post({ error: 'leaflet' });
  } else {
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false,
      minZoom: CFG.minZoom,
      maxZoom: CFG.maxZoom
    }).setView([CFG.lat, CFG.lng], CFG.zoom);

    var tiles = L.tileLayer(CFG.tile, { maxZoom: CFG.maxZoom }).addTo(map);
    var tileErrors = 0;
    tiles.on('tileerror', function () {
      tileErrors++;
      if (tileErrors === 6) post({ error: 'tiles' });
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    var attr = L.control.attribution({ prefix: false, position: 'bottomleft' });
    attr.addAttribution('&copy; OpenStreetMap');
    attr.addTo(map);

    // Épingle "maison" (cercle bleu marine + halo), kima HouseMarker mta3 Flutter
    var houseIcon = L.divIcon({
      className: '',
      iconSize: [64, 64],
      iconAnchor: [32, 32],
      html:
        '<div style="width:64px;height:64px;border-radius:50%;background:rgba(11,60,140,0.2);display:flex;align-items:center;justify-content:center;">' +
        '<div style="width:40px;height:40px;border-radius:50%;background:#003B95;display:flex;align-items:center;justify-content:center;">' +
        '<svg width="22" height="22" viewBox="0 0 24 24" fill="#ffffff"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>' +
        '</div></div>'
    });

    var marker = null;
    function setPos(lat, lng, zoom) {
      if (marker) {
        marker.setLatLng([lat, lng]);
      } else {
        marker = L.marker([lat, lng], { icon: houseIcon, interactive: false }).addTo(map);
      }
      if (zoom) map.setView([lat, lng], zoom);
    }

    if (CFG.point) setPos(CFG.point[0], CFG.point[1], null);

    if (CFG.pick) {
      map.on('click', function (e) {
        setPos(e.latlng.lat, e.latlng.lng, null);
        post({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
    }
  }
</script>
</body>
</html>`;
}