export const handler = async (event: any) => {
  console.log('=== VALIDATE RESULTS ===');
  console.log('Input:', JSON.stringify(event, null, 2));
  
  const currentRestoreCount = event.restoreCount || 0;
  const MAX_RESTORES = 1;
  
  
  const simulateFlag = event.simulateRestore === true;

  const underRestoreLimit = currentRestoreCount < MAX_RESTORES;
  
  
  const shouldRestore = simulateFlag  && underRestoreLimit;
  
  console.log('Current restoreCount:', currentRestoreCount);
  console.log('Max restores allowed:', MAX_RESTORES);
  console.log('SimulateRestore flag:', simulateFlag);

  console.log('Under restore limit:', underRestoreLimit);
  console.log('Final shouldRestore:', shouldRestore);
  
  return {
    ...event,
    needsRestore: shouldRestore,
    restoreCount: currentRestoreCount,
    restoreReason: shouldRestore ? "GPA recalculation needed" : null,
    validationComplete: true
  };
};
