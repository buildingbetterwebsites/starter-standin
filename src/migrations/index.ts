import * as migration_20260928_074637_initial from './20260928_074637_initial';
import * as migration_20260928_074809_add_notes_summary from './20260928_074809_add_notes_summary';

export const migrations = [
  {
    up: migration_20260928_074637_initial.up,
    down: migration_20260928_074637_initial.down,
    name: '20260928_074637_initial',
  },
  {
    up: migration_20260928_074809_add_notes_summary.up,
    down: migration_20260928_074809_add_notes_summary.down,
    name: '20260928_074809_add_notes_summary'
  },
];
