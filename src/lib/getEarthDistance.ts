import { Geolocation } from "./Geolocation";

export const R_meters = 6371e3;
export const R_miles = 3958.8;

/**
 * Calculates the distance from point 1 to point 2 based on R, the radius (in whatever units)
 *
 * Source: https://www.movable-type.co.uk/scripts/latlong.html
 *
 * @param lat1 Latitude of the first point
 * @param lon1 Longitude of the first point
 * @param lat2 Latitude of the second point
 * @param lon2 Longitude of the second point
 * @returns The distance in meters between point 1 and point 2
 */
export default function getEarthDistance(
	firstLocation: Geolocation,
	secondLocation: Geolocation,
	R = R_meters
) {
	const { latitude: lat1, longitude: lon1 } = firstLocation;
	const { latitude: lat2, longitude: lon2 } = secondLocation;
	const φ1 = (lat1 * Math.PI) / 180; // φ, λ in radians
	const φ2 = (lat2 * Math.PI) / 180;
	const Δφ = ((lat2 - lat1) * Math.PI) / 180;
	const Δλ = ((lon2 - lon1) * Math.PI) / 180;

	const a =
		Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
		Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	const d = R * c; // in metres

	return d;
}
