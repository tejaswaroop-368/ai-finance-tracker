import { useEffect, useState } from 'react';

interface ProfileData {
    email?: string;
    createdAt?: string;
    updatedAt?: string;
}

const API_URL = import.meta.env.VITE_API_URL;

const formatDisplayDate = (value?: string) => {
    if (!value) {
        return 'N/A';
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
        return 'N/A';
    }

    return parsedDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const Profile = () => {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadProfile = async () => {
            setIsLoading(true);
            setError('');

            try {
                const response = await fetch(`${API_URL}/api/auth/me`, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });

                if (!response.ok) {
                    const errorBody = await response.json().catch(() => ({}));
                    throw new Error(errorBody.message || 'Unable to load profile.');
                }

                const data = await response.json();
                setProfile(data.user || data || null);
            } catch (fetchError) {
                const message = fetchError instanceof Error ? fetchError.message : 'Unable to load profile.';
                setError(message);
            } finally {
                setIsLoading(false);
            }
        };

        loadProfile();
    }, []);

    return (
        <div className="page-container">
            <h1>Profile</h1>
            {isLoading && <p>Loading profile data...</p>}
            {error && <div className="ai-error-message">{error}</div>}
            {!isLoading && !error && profile && (
                <div style={{ marginTop: '20px' }}>
                    <div className="summary-panel">
                        <div className="summary-item">
                            <span className="summary-title">Email</span>
                            <strong>{profile.email || 'N/A'}</strong>
                        </div>
                        <div className="summary-item">
                            <span className="summary-title">Member Since</span>
                            <strong>{formatDisplayDate(profile.createdAt)}</strong>
                        </div>
                        <div className="summary-item">
                            <span className="summary-title">Last Updated</span>
                            <strong>{formatDisplayDate(profile.updatedAt)}</strong>
                        </div>
                    </div>
                    <p style={{ marginTop: '20px', color: '#4b5563' }}>
                        Manage your profile settings from the account panel. Your login information is securely stored on the backend.
                    </p>
                </div>
            )}
        </div>
    );
};

export default Profile;
