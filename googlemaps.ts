import fetch from "node-fetch";

const googleAPIKey = process.env.GOOGLE_API_KEY;
const placeFields = ["formatted_address", "geometry"].join(",");
const placeCache = {};

export async function getPlaceDetails(placeId: string) {
  if (placeId == null) {
    console.warn("placeID was null");
    return null;
  }

  if (placeId in placeCache) {
    return placeCache[placeId];
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${googleAPIKey}&fields=${placeFields}`
  );
  const json = await response.json();

  if (json.status === "OK") {
    const { result } = json;

    const transformed = {
      formattedAddress: result.formatted_address,
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
    };

    placeCache[placeId] = transformed;

    return transformed;
  } else if (json.status === "INVALID_REQUEST") {
    console.warn("Google Maps API request was invalid.");
  } else if (json.status === "REQUEST_DENIED") {
    console.error("Google Maps API request was denied.");
  }

  placeCache[placeId] = null;

  return null;
}
