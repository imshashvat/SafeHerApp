/**
 * LeafletMapView — OpenStreetMap via WebView + Leaflet.js
 *
 * 100% free — no API key, no billing, no Google.
 * Uses OpenStreetMap tiles (default light) and Leaflet.js (CDN).
 *
 * Props:
 *   circles   — array of { lat, lng, radius, fillColor, strokeColor } for heatmap
 *   markers   — array of { lat, lng, color, popup } for location pins
 *   center    — [lat, lng] initial map center
 *   zoom      — initial zoom level (1-18)
 *   userLat   — user's GPS latitude (renders pulsing blue dot)
 *   userLng   — user's GPS longitude
 *   onPress   — called with { lat, lng, index } when a circle/marker is tapped
 *   theme     — 'light' | 'dark' (default 'light')
 *   style     — ViewStyle
 */

import React, { useRef, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export interface LeafletCircle {
  lat: number;
  lng: number;
  radius: number;       // metres
  fillColor: string;
  strokeColor: string;
  index?: number;       // passed back in onPress
}

export interface LeafletMarker {
  lat: number;
  lng: number;
  color: string;
  popup?: string;
}

export interface LeafletPolyline {
  coords: [number, number][];
  color: string;
  weight?: number;
  opacity?: number;
}

interface Props {
  circles?: LeafletCircle[];
  markers?: LeafletMarker[];
  polylines?: LeafletPolyline[];
  center?: [number, number];
  zoom?: number;
  userLat?: number | null;
  userLng?: number | null;
  onPress?: (data: { index: number }) => void;
  theme?: 'light' | 'dark';
  style?: object;
}

// Tile configurations for light and dark themes
const TILE_CONFIGS = {
  light: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: 'abc',
    bg: '#e8e0d0',
    containerBg: '#f2efe9',
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    subdomains: 'abcd',
    bg: '#0f0a1e',
    containerBg: '#0f0a1e',
  },
};

// Build self-contained HTML — Leaflet loaded from CDN
function buildHtml(
  circles: LeafletCircle[],
  markers: LeafletMarker[],
  polylines: LeafletPolyline[],
  center: [number, number],
  zoom: number,
  theme: 'light' | 'dark',
  userLat?: number | null,
  userLng?: number | null,
): string {
  const tile = TILE_CONFIGS[theme];

  const circleSrc = circles
    .slice(0, 500) // cap for perf
    .map(
      (c, i) =>
        `L.circle([${c.lat},${c.lng}],{radius:${Math.round(c.radius)},` +
        `fillColor:'${c.fillColor}',color:'${c.strokeColor}',` +
        `weight:1,fillOpacity:${theme === 'dark' ? 0.5 : 0.4},opacity:${theme === 'dark' ? 0.8 : 0.7}})` +
        `.on('click',()=>window.ReactNativeWebView.postMessage('${i}'))` +
        `.addTo(map);`,
    )
    .join('\n');

  const markerSrc = markers
    .map(
      (m) =>
        `L.circleMarker([${m.lat},${m.lng}],{radius:8,` +
        `fillColor:'${m.color}',color:'${m.color}',` +
        `weight:2,fillOpacity:0.9})` +
        `${m.popup ? `.bindPopup('${m.popup.replace(/'/g, "\\'")}')` : ''}` +
        `.addTo(map);`,
    )
    .join('\n');

  const polylineSrc = polylines
    .map(
      (p) =>
        `L.polyline(${JSON.stringify(p.coords)},{` +
        `color:'${p.color}',weight:${p.weight ?? 4},` +
        `opacity:${p.opacity ?? 0.85}}).addTo(map);`,
    )
    .join('\n');

  const userDot =
    userLat != null && userLng != null
      ? `
        var userCircle = L.circleMarker([${userLat},${userLng}],{
          radius:10, fillColor:'#4A90E2', color:'#fff',
          weight:2, fillOpacity:0.95
        }).bindPopup('You are here').addTo(map);
        // pulsing ring
        L.circle([${userLat},${userLng}],{
          radius:350, fillColor:'#4A90E2', color:'#4A90E2',
          weight:1, fillOpacity:0.1, opacity:0.4
        }).addTo(map);
      `
      : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body,#map{width:100%;height:100%;background:${tile.bg}}
  .leaflet-container{background:${tile.bg}!important}
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var map = L.map('map',{
  center:[${center[0]},${center[1]}],
  zoom:${zoom},
  zoomControl:true,
  attributionControl:false
});
L.tileLayer('${tile.url}',{
  maxZoom:19,
  subdomains:'${tile.subdomains}'
}).addTo(map);
${circleSrc}
${polylineSrc}
${markerSrc}
${userDot}
</script>
</body>
</html>`;
}

export default function LeafletMapView({
  circles = [],
  markers = [],
  polylines = [],
  center = [22.5, 78.5],
  zoom = 5,
  userLat,
  userLng,
  onPress,
  theme = 'light',
  style,
}: Props) {
  const webRef = useRef<WebView>(null);

  const handleMessage = useCallback(
    (e: { nativeEvent: { data: string } }) => {
      const index = parseInt(e.nativeEvent.data, 10);
      if (!isNaN(index) && onPress) onPress({ index });
    },
    [onPress],
  );

  const html = buildHtml(circles, markers, polylines, center, zoom, theme, userLat, userLng);
  const tile = TILE_CONFIGS[theme];

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html }}
        style={[styles.webview, { backgroundColor: tile.containerBg }]}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        onMessage={handleMessage}
        // Allow internet for CDN + tile fetches
        mixedContentMode="always"
        allowsInlineMediaPlayback
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  webview: { flex: 1 },
});
