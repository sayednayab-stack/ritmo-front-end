// Channel managers registered in the backend (app/cm/adapter.py). Keep in sync when one is added.
// Safetrax is registered but its adapter is currently a stub.
export const CM_PROVIDER_OPTIONS = [
  { value: 'ride', label: 'RIDE' },
  { value: 'iway', label: 'iWay' },
  { value: 'safetrax', label: 'Safetrax' },
];
