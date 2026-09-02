export function codexExecutionAvailable() {
  const override = process.env.LUMITERRA_CODEX_ENABLED?.trim().toLowerCase();
  if (override === 'true' || override === '1') return true;
  if (override === 'false' || override === '0') return false;

  const hostedOnRailway = Boolean(
    process.env.RAILWAY_PROJECT_ID
    || process.env.RAILWAY_ENVIRONMENT_ID
    || process.env.RAILWAY_SERVICE_ID,
  );
  return !hostedOnRailway;
}
