import { Horizon, Observer } from 'astronomy-engine';
import { CONSTELLATIONS } from './src/data/constellations.ts';
import { BRIGHT_STARS } from './src/data/stars.ts';
import { CONSTELLATION_OPTIMAL_MAP, getOptimalObserverForConstellation } from './src/lib/astronomy/constellationFocus.ts';

const starMap = new Map(BRIGHT_STARS.map(st => [st.id, st]));
const DEG_TO_RAD = Math.PI / 180;

function horizonToVector(azimuth, altitude) {
  const azimuthRad = azimuth * DEG_TO_RAD;
  const altitudeRad = altitude * DEG_TO_RAD;
  const horizontalRadius = Math.cos(altitudeRad);
  return {
    x: Math.sin(azimuthRad) * horizontalRadius,
    y: Math.sin(altitudeRad),
    z: -Math.cos(azimuthRad) * horizontalRadius,
  };
}

function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

console.log('--- COMPARING CAMERA LOOK DIRECTION VS ACTUAL CONSTELLATION STARS ---');

for (const con of CONSTELLATIONS) {
  const opt = CONSTELLATION_OPTIMAL_MAP[con.id];
  const defaultObs = { latitude: 35.0, longitude: 120.0, date: '2026-09-16T13:30:00.000Z', label: 'Default' };
  const res = getOptimalObserverForConstellation(con.id, defaultObs, 'UTC+8');
  const d = new Date(res.observer.date);
  const astroObs = new Observer(res.observer.latitude, res.observer.longitude, 0);

  // 1. What targetYaw and targetPitch did StarSeaCanvas compute?
  const centerHoriz = Horizon(d, astroObs, opt.raHours, opt.decDegrees, 'normal');
  const targetYaw = (centerHoriz.azimuth * Math.PI) / 180;
  const targetPitch = Math.max(0.18, Math.min(1.40, (centerHoriz.altitude * Math.PI) / 180));

  // Camera look vector from yaw and pitch:
  const camDir = {
    x: Math.sin(targetYaw) * Math.cos(targetPitch),
    y: Math.sin(targetPitch),
    z: -Math.cos(targetYaw) * Math.cos(targetPitch),
  };

  // 2. Where are the actual stars of the constellation?
  const starIds = new Set();
  con.segments.forEach(([a, b]) => { starIds.add(a); starIds.add(b); });

  const angles = [];
  for (const id of starIds) {
    const star = starMap.get(id);
    if (!star) continue;
    const h = Horizon(d, astroObs, star.raHours, star.decDegrees, 'normal');
    const sVec = horizonToVector(h.azimuth, h.altitude);
    const cosTheta = Math.max(-1, Math.min(1, dot(camDir, sVec)));
    const angleDeg = Math.acos(cosTheta) * (180 / Math.PI);
    angles.push(angleDeg);
  }

  const minAngle = Math.min(...angles);
  const maxAngle = Math.max(...angles);
  const avgAngle = angles.reduce((a, b) => a + b, 0) / angles.length;
  const inFov = angles.filter(a => a < 31).length;

  const status = avgAngle < 20 ? 'PERFECT' : (minAngle < 31 ? 'PARTIAL' : 'FAILED_OFF_SCREEN');
  console.log(`${con.id.padEnd(14)} (${con.nameZh.padEnd(10)}): MinAng=${minAngle.toFixed(1)}° AvgAng=${avgAngle.toFixed(1)}° MaxAng=${maxAngle.toFixed(1)}° | InFOV: ${inFov}/${angles.length} => ${status}`);
}
