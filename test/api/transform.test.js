import { transformToApi, transformToDb } from '../../src/api/transform.js';

describe('API/database transforms', () => {
  it('converts database keys to API keys', () => {
    expect(transformToApi({ day_begins_hr: 5, admin_passcode: 'secret' })).toEqual({
      dayBeginsHr: 5,
      adminPasscode: 'secret'
    });
  });

  it('converts API keys to database keys', () => {
    expect(transformToDb({ dayBeginsHr: 5, adminPasscode: 'secret' })).toEqual({
      day_begins_hr: 5,
      admin_passcode: 'secret'
    });
  });
});