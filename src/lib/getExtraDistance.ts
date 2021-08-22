import { Geolocation } from "./Geolocation";
import getEarthDistance, { R_miles } from "./getEarthDistance";

export default function getExtraDistance(
	theirLocation: Geolocation,
	myLocation: Geolocation,
	eventLocation: Geolocation
) {
	if (myLocation != null && theirLocation != null) {
		const meToThem = getEarthDistance(myLocation, theirLocation, R_miles);
		const themToLocation = getEarthDistance(
			theirLocation,
			eventLocation,
			R_miles
		);
		const meToLocation = getEarthDistance(myLocation, eventLocation, R_miles);
		return meToThem + themToLocation - meToLocation;
	} else {
		return null;
	}
}
