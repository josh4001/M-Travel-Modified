import type { DivIcon } from 'leaflet';

export interface VehicleMarkerOptions {
  heading: number;
  speed: number;
  vehicleType?: string;
  isStale?: boolean;
  plateNumber?: string;
}

/**
 * Returns an SVG path string for a clean luxury top-down vehicle silhouette
 */
function getVehicleSvg(_type = 'SUV'): string {
  // Top-down sleek vehicle shape
  return `
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Shadow -->
      <ellipse cx="24" cy="24" rx="14" ry="20" fill="rgba(0,0,0,0.35)" filter="blur(2px)"/>
      <!-- Outer Chassis -->
      <rect x="12" y="6" width="24" height="36" rx="8" fill="#0f172a" stroke="#38bdf8" stroke-width="2"/>
      <!-- Windshield Front -->
      <path d="M15 14 C15 12, 33 12, 33 14 L31 20 L17 20 Z" fill="#0284c7"/>
      <!-- Roof -->
      <rect x="16" y="21" width="16" height="10" rx="2" fill="#1e293b"/>
      <!-- Rear Window -->
      <path d="M16 32 L32 32 L30 36 L18 36 Z" fill="#0284c7"/>
      <!-- Headlights -->
      <circle cx="15" cy="7" r="2" fill="#fef08a"/>
      <circle cx="33" cy="7" r="2" fill="#fef08a"/>
      <!-- Taillights -->
      <rect x="14" y="40" width="4" height="2" rx="1" fill="#ef4444"/>
      <rect x="30" y="40" width="4" height="2" rx="1" fill="#ef4444"/>
      <!-- Center Direction Arrow Indicator -->
      <path d="M24 10 L21 16 L27 16 Z" fill="#ffffff" opacity="0.9"/>
    </svg>
  `;
}

/**
 * Creates a reactive Leaflet DivIcon for an assigned vehicle with smooth heading rotation.
 */
export function createAssignedVehicleIcon(
  L: typeof import('leaflet'),
  options: VehicleMarkerOptions
): DivIcon {
  const { heading = 0, speed = 0, vehicleType = 'SUV', isStale = false, plateNumber } = options;

  const html = `
    <div class="assigned-vehicle-marker-wrapper" style="position: relative; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center;">
      <!-- Subtle radar aura when moving -->
      ${
        speed > 0 && !isStale
          ? `<div style="
              position: absolute; inset: 4px; border-radius: 9999px;
              background: rgba(16, 185, 129, 0.12);
              border: 1.5px solid rgba(16, 185, 129, 0.5);
              box-shadow: 0 0 12px rgba(16, 185, 129, 0.35);
            "></div>`
          : ''
      }

      <!-- Vehicle Plate Number Tag -->
      ${
        plateNumber
          ? `<div style="
              position: absolute; top: -14px; background: #0f172a;
              color: #f59e0b; font-size: 8px; font-weight: 800; font-family: monospace;
              border-radius: 4px; padding: 1px 4px; border: 1px solid rgba(245, 158, 11, 0.4);
              box-shadow: 0 2px 4px rgba(0,0,0,0.3); z-index: 10; white-space: nowrap; pointer-events: none;
            ">${plateNumber}</div>`
          : ''
      }

      <!-- Stale warning badge -->
      ${
        isStale
          ? `<div style="
              position: absolute; top: -6px; right: -6px; background: #f59e0b;
              color: #ffffff; font-size: 9px; font-weight: bold; border-radius: 9999px;
              padding: 2px 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.3); z-index: 10; pointer-events: none;
            ">GPS Lost</div>`
          : ''
      }

      <!-- Speed Badge -->
      ${
        speed > 0 && !isStale
          ? `<div class="vehicle-speed-badge" style="
              position: absolute; bottom: -8px; background: #0f172a;
              color: #10b981; font-size: 9px; font-weight: 800; font-family: monospace;
              border-radius: 6px; padding: 1px 4px; border: 1px solid #10b981;
              box-shadow: 0 2px 6px rgba(0,0,0,0.4); z-index: 10; white-space: nowrap; pointer-events: none;
            ">${Math.round(speed)} km/h</div>`
          : '<div class="vehicle-speed-badge" style="display:none;"></div>'
      }

      <!-- Rotatable Vehicle Silhouette (Pure hardware rotation without CSS transition conflicts) -->
      <div class="vehicle-heading-rotator" style="
        transform: rotate(${heading}deg);
        width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;
        will-change: transform;
      ">
        ${getVehicleSvg(vehicleType)}
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'm-travel-vehicle-marker',
    html,
    iconSize: [56, 56],
    iconAnchor: [28, 28],
    popupAnchor: [0, -28],
  });
}
