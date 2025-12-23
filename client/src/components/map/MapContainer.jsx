/**
 * Map Container Component
 * 
 * Simple wrapper for Leaflet map with OpenStreetMap tiles.
 * Uses vanilla Leaflet to avoid react-leaflet context issues.
 */

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapContainer.css';

// Fix for default marker icons in Leaflet with webpack/vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const MapContainer = ({ 
    initialCenter = [37.7749, -122.4194], 
    initialZoom = 13,
    markers = [],
    onMapReady = null
}) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const isInitializedRef = useRef(false);

    // Initialize map only once
    useEffect(() => {
        if (mapRef.current && !isInitializedRef.current) {
            isInitializedRef.current = true;
            
            const map = L.map(mapRef.current, {
                center: initialCenter,
                zoom: initialZoom
            });
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            mapInstanceRef.current = map;

            if (onMapReady) {
                onMapReady(map);
            }
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
                isInitializedRef.current = false;
            }
        };
    }, []); // Empty deps - only run once

    // Update markers when they change
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        // Clear existing markers
        markersRef.current.forEach(marker => {
            try {
                marker.remove();
            } catch (e) {
                // Ignore errors from already removed markers
            }
        });
        markersRef.current = [];

        // Add new markers
        markers.forEach(({ lat, lng, popup, icon: customIcon }) => {
            const markerOptions = customIcon ? { icon: customIcon } : {};
            const marker = L.marker([lat, lng], markerOptions).addTo(map);
            if (popup) {
                marker.bindPopup(popup);
            }
            markersRef.current.push(marker);
        });
    }, [markers]);

    return (
        <div className="map-wrapper">
            <div ref={mapRef} className="leaflet-map-container" />
        </div>
    );
};

export default MapContainer;
