import React, { useEffect, useRef, useState } from 'react';
import apiClient from '../api/apiClient';

const GMAPS_SCRIPT_ID = 'pve-gmaps-script';

export default function PlotBoundaryTracer({ listingId, centerLat, centerLng, onSaveSuccess }) {
  const mapContainerRef = useRef(null);
  const polygonRef = useRef(null);
  const pointsRef = useRef([]);
  const doneRef = useRef(false);

  const [saving, setSaving] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [hint, setHint] = useState('Click on the map to place boundary points. Double-click to finish.');

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setErrorMessage('Missing VITE_GOOGLE_MAPS_API_KEY in realfrontend/.env');
      return;
    }

    let cancelled = false;

    function initMap() {
      if (cancelled || !mapContainerRef.current || !window.google?.maps) return;

      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: { lat: centerLat, lng: centerLng },
        zoom: 19,
        mapTypeId: 'satellite',
        tilt: 0,
        disableDoubleClickZoom: true
      });

      const polygon = new window.google.maps.Polygon({
        paths: [],
        strokeColor: '#2563eb',
        strokeWeight: 2,
        fillColor: '#2563eb',
        fillOpacity: 0.25
      });
      polygon.setMap(map);
      polygonRef.current = polygon;

      // Single click = add a boundary point
      map.addListener('click', (e) => {
        if (doneRef.current) return;
        pointsRef.current.push(e.latLng);
        polygon.setPath([...pointsRef.current]);
        setHint(`${pointsRef.current.length} point(s) placed. Double-click to finish the boundary.`);
      });

      // Double-click = close the polygon and make it editable
      map.addListener('dblclick', () => {
        if (doneRef.current) return;
        if (pointsRef.current.length < 3) {
          setHint('Add at least 3 points before finishing.');
          return;
        }
        doneRef.current = true;
        polygon.setEditable(true);
        polygon.setDraggable(true);
        setHasDrawn(true);
        setHint('Boundary complete! Drag corner points to adjust, then click Save.');
      });
    }

    if (window.google?.maps) {
      // Already loaded
      initMap();
    } else if (!document.getElementById(GMAPS_SCRIPT_ID)) {
      // Inject script once
      const script = document.createElement('script');
      script.id = GMAPS_SCRIPT_ID;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async`;
      script.onload = () => { if (!cancelled) initMap(); };
      script.onerror = () => {
        if (!cancelled) setErrorMessage('Failed to load Google Maps. Make sure Maps JavaScript API is enabled in Google Cloud.');
      };
      document.head.appendChild(script);
    } else {
      // Script injected but not loaded yet — poll
      const poll = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(poll);
          if (!cancelled) initMap();
        }
      }, 100);
      return () => { cancelled = true; clearInterval(poll); };
    }

    return () => { cancelled = true; };
  }, [centerLat, centerLng]);

  const handleSave = async () => {
    if (!polygonRef.current || pointsRef.current.length < 3) {
      alert('Draw a boundary first.');
      return;
    }

    const path = polygonRef.current.getPath();
    const coordinates = [];
    for (let i = 0; i < path.getLength(); i++) {
      const pt = path.getAt(i);
      coordinates.push([pt.lng(), pt.lat()]);
    }
    coordinates.push(coordinates[0]); // close the GeoJSON ring

    const boundaryGeoJSON = {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [coordinates] },
      properties: {}
    };

    try {
      setSaving(true);
      setErrorMessage(null);
      await apiClient.patch(`/api/v1/dashboard/listings/${listingId}/boundary`, { boundaryGeoJSON });
      onSaveSuccess();
    } catch (err) {
      setErrorMessage(err.response?.data?.error?.message || 'Failed to save the boundary.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.container}>
      {errorMessage && <div style={styles.errorBanner}>⚠️ {errorMessage}</div>}
      <div ref={mapContainerRef} style={styles.canvasFrame} />
      <footer style={styles.footerPanel}>
        <p style={styles.helperTxt}>💡 {hint}</p>
        <button
          onClick={handleSave}
          disabled={saving || !hasDrawn}
          style={{ ...styles.saveBtn, backgroundColor: (saving || !hasDrawn) ? '#9ca3af' : '#2563eb' }}
        >
          {saving ? 'Saving…' : '💾 Save Property Boundary'}
        </button>
      </footer>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', width: '100%', height: '520px', gap: '12px' },
  errorBanner: { padding: '10px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b', fontSize: '13px', borderRadius: '6px' },
  canvasFrame: { flex: 1, width: '100%', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' },
  footerPanel: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingTop: '4px' },
  helperTxt: { margin: 0, fontSize: '13px', color: '#4b5563', maxWidth: '70%', lineHeight: '1.4' },
  saveBtn: { border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }
};
