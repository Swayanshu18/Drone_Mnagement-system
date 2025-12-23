/**
 * Drawing Tools Component
 * 
 * Uses Leaflet Draw directly via useEffect hook.
 * Receives map instance as prop (vanilla Leaflet approach).
 */

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import * as turf from '@turf/turf';

// Patch leaflet-draw's readableArea bug (type is undefined)
if (L.GeometryUtil && L.GeometryUtil.readableArea) {
    const originalReadableArea = L.GeometryUtil.readableArea;
    L.GeometryUtil.readableArea = function(area, isMetric, precision) {
        try {
            return originalReadableArea.call(this, area, isMetric, precision);
        } catch (e) {
            // Fallback if the original function fails
            if (isMetric) {
                return area >= 10000 
                    ? (area / 1000000).toFixed(precision?.km || 2) + ' km²'
                    : area.toFixed(precision?.m || 0) + ' m²';
            }
            return area.toFixed(2) + ' sq ft';
        }
    };
}

const DrawingTools = ({ map, onAreaCreated }) => {
    const drawnItemsRef = useRef(null);
    const drawControlRef = useRef(null);
    const onAreaCreatedRef = useRef(onAreaCreated);

    // Keep callback ref updated
    useEffect(() => {
        onAreaCreatedRef.current = onAreaCreated;
    }, [onAreaCreated]);

    useEffect(() => {
        if (!map) return;

        // Create FeatureGroup for drawn items
        const drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);
        drawnItemsRef.current = drawnItems;

        // Initialize draw control
        const drawControl = new L.Control.Draw({
            position: 'topright',
            draw: {
                polygon: {
                    allowIntersection: false,
                    showArea: false, // Disabled to avoid leaflet-draw bug
                    drawError: {
                        color: '#e1e100',
                        message: '<strong>Error:</strong> shape edges cannot cross!'
                    },
                    shapeOptions: {
                        color: '#007bff'
                    }
                },
                polyline: false,
                circle: false,
                rectangle: false,
                marker: false,
                circlemarker: false
            },
            edit: {
                featureGroup: drawnItems,
                remove: true
            }
        });

        map.addControl(drawControl);
        drawControlRef.current = drawControl;

        // Event handlers
        const handleCreated = (e) => {
            const layer = e.layer;
            drawnItems.addLayer(layer);

            const geoJSON = layer.toGeoJSON();
            const area = turf.area(geoJSON);

            console.log('Polygon created:', { area, geometry: geoJSON.geometry });

            if (onAreaCreatedRef.current) {
                onAreaCreatedRef.current({
                    geometry: geoJSON.geometry,
                    area
                });
            }
        };

        const handleEdited = () => {
            const layers = drawnItems.getLayers();
            if (layers.length > 0) {
                const geoJSON = layers[0].toGeoJSON();
                const area = turf.area(geoJSON);

                if (onAreaCreatedRef.current) {
                    onAreaCreatedRef.current({
                        geometry: geoJSON.geometry,
                        area
                    });
                }
            }
        };

        const handleDeleted = () => {
            if (onAreaCreatedRef.current) {
                onAreaCreatedRef.current(null);
            }
        };

        map.on(L.Draw.Event.CREATED, handleCreated);
        map.on(L.Draw.Event.EDITED, handleEdited);
        map.on(L.Draw.Event.DELETED, handleDeleted);

        // Cleanup
        return () => {
            map.off(L.Draw.Event.CREATED, handleCreated);
            map.off(L.Draw.Event.EDITED, handleEdited);
            map.off(L.Draw.Event.DELETED, handleDeleted);

            if (drawControlRef.current) {
                map.removeControl(drawControlRef.current);
            }
            if (drawnItemsRef.current) {
                map.removeLayer(drawnItemsRef.current);
            }
        };
    }, [map]); // Removed onAreaCreated from dependencies

    return null;
};

export default DrawingTools;
