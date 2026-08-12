import { initDayIfNeeded } from '../../../src/shared/utils/processes.js';
import db from '../../../src/shared/db.js';
import { jest } from '@jest/globals';

const mockGet = jest.fn(() => ({
  curr_day: '2026-08-09',
  day_begins_hr: 14,
  init_day_status: 'ready'
}));
const mockAll = jest.fn(() => [
  { fk_member_id: 1, fk_team_id: 1, name: 'Wash dishes' },
  { fk_member_id: 2, fk_team_id: 1, name: 'Take out trash' }
]);
const mockRun = jest.fn();
const mockPrepare = jest.fn(() => ({
  get: mockGet,
  all: mockAll,
  run: mockRun
}));

jest.mock('../../../src/shared/db.js', () => ({
  __esModule: true,
  default: {
    prepare: mockPrepare
  }
}));

describe('initDayIfNeeded', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers('modern');
    jest.setSystemTime(new Date('2026-08-10T15:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should initialize a new day when conditions are met', () => {
    initDayIfNeeded();

    expect(mockPrepare).toHaveBeenCalled();
    expect(mockRun).toHaveBeenCalled();
  });
});
