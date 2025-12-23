/**
 * Drone Registration Form
 * 
 * Component for adding new drones to the fleet.
 */

import { useState, useEffect } from 'react';
import { droneService } from '../../services/droneService';
import { siteService } from '../../services/siteService';
import './DroneForm.css';

function DroneForm({ onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        serial_number: '',
        model: '',
        weight: '',
        max_flight_time: '',
        site_id: ''
    });

    const [sites, setSites] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSites = async () => {
            try {
                const data = await siteService.getAllSites();
                setSites(data);
                if (data.length > 0) {
                    setFormData(prev => ({ ...prev, site_id: data[0].id }));
                }
            } catch (err) {
                console.error('Failed to fetch sites', err);
                // Not critical, can still add drone without site or type one manually if UI allows
            }
        };
        fetchSites();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Validate
            if (!formData.name || !formData.serial_number || !formData.model) {
                throw new Error('Please fill in all required fields');
            }

            await droneService.createDrone({
                ...formData,
                weight: parseFloat(formData.weight) || 0,
                max_flight_time: parseInt(formData.max_flight_time) || 0
            }); // backend will handle defaults for status etc.

            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to register drone');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="drone-form-overlay">
            <div className="drone-form-modal">
                <div className="modal-header">
                    <h2>Register New Drone</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="drone-form">
                    {error && <div className="alert alert-danger">{error}</div>}

                    <div className="form-group">
                        <label>Name*</label>
                        <input
                            type="text"
                            name="name"
                            className="form-input"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. Alpha-1"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Model*</label>
                        <input
                            type="text"
                            name="model"
                            className="form-input"
                            value={formData.model}
                            onChange={handleChange}
                            placeholder="e.g. DJI Mavic 3"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Serial Number*</label>
                        <input
                            type="text"
                            name="serial_number"
                            className="form-input"
                            value={formData.serial_number}
                            onChange={handleChange}
                            placeholder="Unique Serial Number"
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Weight (g)</label>
                            <input
                                type="number"
                                name="weight"
                                className="form-input"
                                value={formData.weight}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Max Flight Time (min)</label>
                            <input
                                type="number"
                                name="max_flight_time"
                                className="form-input"
                                value={formData.max_flight_time}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Assigned Site</label>
                        <select
                            name="site_id"
                            className="form-input"
                            value={formData.site_id}
                            onChange={handleChange}
                        >
                            <option value="">-- Select Site --</option>
                            {sites.map(site => (
                                <option key={site.id} value={site.id}>{site.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Registering...' : 'Register'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default DroneForm;
