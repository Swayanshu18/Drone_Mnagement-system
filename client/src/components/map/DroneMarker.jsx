/**
 * Drone Marker Utility
 * 
 * Creates a Leaflet marker configuration for drones.
 * Used with vanilla Leaflet (not react-leaflet).
 */

import L from 'leaflet';

/**
 * Get status color for drone marker
 */
export const getStatusColor = (status) => {
    switch (status) {
        case 'available': return '#28a745';
        case 'in-mission': return '#007bff';
        case 'maintenance': return '#ffc107';
        case 'offline': return '#dc3545';
        default: return '#6c757d';
    }
};

/**
 * Create a drone icon for Leaflet markers
 */
export const createDroneIcon = (status = 'available') => {
    return L.divIcon({
        className: 'custom-drone-marker',
        html: `
            <div style="
                width: 30px; 
                height: 30px; 
                background: white; 
                border-radius: 50%;
                border: 3px solid ${getStatusColor(status)};
                display: flex; 
                align-items: center; 
                justify-content: center;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                cursor: pointer;
                font-size: 16px;
            ">
                🚁
            </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });
};

/**
 * Create a marker config object for use with MapContainer
 */
export const createDroneMarker = ({ latitude, longitude, id, status = 'available', name }) => {
    return {
        lat: latitude,
        lng: longitude,
        icon: createDroneIcon(status),
        popup: `<strong>Drone ${name || id}</strong><br/>Status: ${status}`
    };
};

export default createDroneMarker;
