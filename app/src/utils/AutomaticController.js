import { findNearest, getRhumbLineBearing, getDistance } from "geolib";

import { Cam } from "./Cam";

function getBearingDiff(a, b) {
  let angle = Math.abs(a - b);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

function getDirection(location, heading, indexOfNextWaypoint) {
  const downstreamBearingDiff = getBearingDiff(
    heading,
    getRhumbLineBearing(location, riverWaypoints[indexOfNextWaypoint + 1])
  );
  const upstreamBearingDiff = getBearingDiff(
    heading,
    getRhumbLineBearing(location, riverWaypoints[indexOfNextWaypoint - 1])
  );
  return downstreamBearingDiff < upstreamBearingDiff ? 1 : -1; // 1 is downstream, -1 is upstream
}

const Kp = 0.25;
const Ki = 0.1;
const Kd = 0.05;

export default class AutomaticController {
  constructor() {
    this.previousTime = Date();
    this.previousError = 0;
    this.integralTerm = 0;
  }

  update(heading, location, time) {
    const riverWaypoints = Cam.map((coords) => ({
      latitude: coords[0],
      longitude: coords[1],
    }));

    // Get the nearest waypoint
    const nearestWaypoint = findNearest(location, riverWaypoints);
    const indexOfNearestWaypoint = riverWaypoints.indexOf(nearestWaypoint);

    // Get the direction of travel
    const direction = getDirection(location, heading, indexOfNearestWaypoint);

    // Find waypoints within 100m in the direction of travel
    const waypoints = [nearestWaypoint];
    let distance = 0;
    let i = indexOfNearestWaypoint + direction;
    while (distance < 100 || i < 0 || i >= riverWaypoints.length) {
      waypoints.push(riverWaypoints[i]);
      distance += getDistance(waypoints[i - direction], waypoints[i]);
      i += direction;
    }

    // Calculate the bearings of the river through the next waypoints
    const bearings = [];
    let j = 0;
    while (j < waypoints.length - 1) {
      bearings.push(getRhumbLineBearing(waypoints[j], waypoints[j + 1]));
      j++;
    }

    // Compare our current heading with a weighting of the next river bearings and use this as the input of a PID controller
    const weightingFunction = (i) => 100 - (100 / bearings.length) * i;
    const normalisationConstant =
      1 / Math.sum(bearings.map((_, i) => weightingFunction(i)));
    const weightedBearing = bearings.reduce(
      (acc, cur, i) => acc + cur * weightingFunction(i) * normalisationConstant,
      0
    );

    const error = weightedBearing - heading;
    this.integralTerm += error * (time - this.previousTime);
    const output =
      Kp * error +
      Ki * this.integralTerm +
      (Kd * (error - this.previousError)) / (time - this.previousTime);
    this.previousTime = time;
    this.previousError = error;

    if (output > 90) return 90;
    if (output < -90) return -90;
    else return output;
  }
}
