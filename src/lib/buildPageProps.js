export function buildPageProps(state) {
  const { routing, disaster, energy, water, ...rest } = state;

  return {
    ...rest,
    path: routing.path,
    start: routing.start,
    pathError: routing.pathError,
    routeHistory: routing.routeHistory,
    onNodeClick: (nodeId) => routing.handleNodeClick(nodeId, rest.mode),
    runAutoRoute: () => routing.runAutoRoute(rest.mode),
    clearPath: routing.clearPath,
    setPathError: routing.setPathError ?? (() => {}),
    // disaster
    floodActive: disaster.floodActive,
    blockedCount: rest.blockedCount,
    handleTriggerFlood: disaster.handleTriggerFlood,
    handleResetFlood: disaster.handleResetFlood,
    // energy
    failedStation: energy.failedStation,
    stationLoads: energy.stationLoads,
    avgStationLoad: energy.avgStationLoad,
    handleSimulateFailure: energy.handleSimulateFailure,
    handleResetEnergy: energy.handleResetEnergy,
    // water
    burstActive: water.burstActive,
    zonePressures: water.zonePressures,
    z7Pressure: water.z7Pressure,
    handleSimulateBurst: water.handleSimulateBurst,
    handleResetWater: water.handleResetWater,
  };
}