import { MuiDynamicDataTable } from '../index';

test('Data table test', () => {
  expect(MuiDynamicDataTable({ columns: [], data: [] })).toBeTruthy();
});
