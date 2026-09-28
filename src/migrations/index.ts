import * as migration_20260928_074637_initial from './20260928_074637_initial';

export const migrations = [
  {
    up: migration_20260928_074637_initial.up,
    down: migration_20260928_074637_initial.down,
    name: '20260928_074637_initial'
  },
];
