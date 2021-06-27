import fetch from "node-fetch";

const googleAPIKey = process.env.GOOGLE_API_KEY;
const placeFields = ["formatted_address", "geometry"].join(",");

export async function getPlaceDetails(placeId: string) {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${googleAPIKey}&fields=${placeFields}`
  );
  const json = await response.json();

  console.log(placeId, json);

  if (json.status === "OK") {
    const { result } = json;

    const transformed = {
      formattedAddress: result.formatted_address,
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
    };

    return transformed;
  } else if (json.status === "INVALID_REQUEST") {
    return null;
  } else if (json.status === "REQUEST_DENIED") {
    console.error("Google Maps API request was denied.");
    return null;
  }
}
