/**
 * Given an ordered list of [lat, lng] waypoints,
 * returns the actual road polyline coordinates from OSRM.
 */
export async function fetchRoadPath(waypoints) {
  if (waypoints.length < 2) return waypoints;

  const coords = waypoints.map(([lat, lng]) => `${lng},${lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;

  console.log("OSRM URL:", url); // ← add this

  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("OSRM response:", data); // ← and this

    if (data.code !== "Ok" || !data.routes?.[0]) return waypoints;
    return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  } catch (err) {
    console.error("OSRM failed:", err); // ← and this
    return waypoints;
  }
}
