import * as migration_20260928_074013_initial from './20260928_074013_initial';

export const migrations = [
  {
    up: migration_20260928_074013_initial.up,
    down: migration_20260928_074013_initial.down,
    name: '20260928_074013_initial'
  },
];
