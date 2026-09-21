import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * DriverDashboard (Decommissioned)
 * The platform strictly supports Traveler, Fleet Host, and Admin roles.
 * Any legacy links to driver dashboard seamlessly redirect to tourist dashboard.
 */
export default function DriverDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/dashboard/tourist', { replace: true });
  }, [navigate]);

  return null;
}
