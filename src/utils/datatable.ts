import type {
  DataTableRecord,
  DataTableColumn,
  Filters,
  CheckboxInput,
  DropdownInput,
  RangeInput,
} from '../models/datatable';

export function isCheckboxInput(
  object: CheckboxInput | DropdownInput | RangeInput
): object is CheckboxInput {
  return 'items' in object && !('selected' in object);
}
export function isDropdownInput(
  object: CheckboxInput | DropdownInput | RangeInput
): object is DropdownInput {
  return 'items' in object && 'selected' in object;
}
export function isRangeInput(
  object: CheckboxInput | DropdownInput | RangeInput
): object is RangeInput {
  return 'min' in object && 'max' in object;
}

/**
 * Create filters for an array of data table records
 * @param data Data to create filters for
 * @param columns Columns to use to create filters
 * @returns Filters for the table
 */
export const createFilters = <T extends DataTableRecord>(
  data: T[],
  columns: DataTableColumn<T>[]
): Filters<T> => {
  const filters: Record<string, any> = {};
  // Create entry for every field
  columns.forEach(
    ({
      name,
      style,
      rendering,
      getRenderedEntry,
      getFilterIdentifier,
      getSearchEntry,
    }) => {
      const commonProps = {
        style: style ?? 'default',
        getRenderedEntry,
        getFilterIdentifier,
        getSearchEntry,
      };
      const { style: commonStyle } = commonProps;
      const strName = name.toString();
      if (
        commonStyle === 'date' ||
        commonStyle === 'datetime' ||
        commonStyle === 'time' ||
        commonStyle === 'number'
      ) {
        filters[strName] = { ...commonProps, input: { min: null, max: null } };
      } else if (commonStyle === 'select') {
        filters[strName] = {
          ...commonProps,
          input: { items: [], selected: null, rendering },
        };
      } else {
        filters[strName] = {
          ...commonProps,
          input: { items: [], rendering },
        };
      }
    }
  );

  // Populate options
  Object.keys(filters).forEach((column) => {
    const { input, getRenderedEntry, getFilterIdentifier, getSearchEntry } = (
      filters as Filters<T>
    )[column];
    data.forEach((row: T, index) => {
      const castColumn = column as keyof T;
      if (isDropdownInput(input) || isCheckboxInput(input)) {
        const entry = row[castColumn] as T[string];
        const node = input.rendering?.disableFilterModal
          ? getSearchEntry?.(entry) ?? entry
          : getRenderedEntry?.(entry) ?? entry;
        const id = getFilterIdentifier?.(entry) ?? entry ?? index;
        if (node === null || node === undefined) {
          return;
        }
        const populatedItem = {
          value: id.toString(),
          node,
        };
        if (input?.items.every((item) => item.value !== populatedItem.value)) {
          if (isCheckboxInput(input)) {
            input.items.push({ ...populatedItem, checked: false });
          } else {
            input.items.push(populatedItem);
          }
        }
      }
    });
  });
  return filters as Filters<T>;
};

/**
 * Get the number of currently applied filters
 * @param filters Data table filters
 * @returns The number of currently applied filters
 */
export const countFilters = <T extends DataTableRecord>(filters: Filters<T>) =>
  Object.keys(filters)
    .map((field) => {
      const filter = filters[field];
      const { input } = filter;
      if (isRangeInput(input)) {
        return input?.min !== null && input?.max !== null ? 1 : 0;
      }
      if (isCheckboxInput(input)) {
        return input.items.filter((box) => box.checked).length;
      }
      if (isDropdownInput(input)) {
        return input.selected !== null && input.selected !== '' ? 1 : 0;
      }
      return 0;
    })
    .reduce((acc, curr) => acc + curr, 0);

/**
 * Filter an array of data table records
 * @param data Dataset to filter
 * @param filters Filters to apply
 * @returns A filtered version of the original dataset
 */
export const filterData = <T extends DataTableRecord>(
  data: { key: number; row: T }[],
  filters: Filters<T> | null
) => {
  if (!filters) {
    return data;
  }
  return data.flatMap(({ key, row }) => {
    const columns = Object.keys(row);
    const keepFields = columns
      .map((column) => column as keyof T)
      .filter((column) => {
        const filter = filters[column];
        if (!filter) return true;
        const { input } = filter;
        const rawEntry = row[column];
        const entry = filter.getFilterIdentifier?.(rawEntry) ?? rawEntry;
        // Checkbox filter
        if (isCheckboxInput(input)) {
          const checkedCount = input.items.filter((box) => box.checked).length;

          if (
            typeof entry !== 'string' &&
            typeof entry !== 'number' &&
            typeof entry !== 'boolean'
          ) {
            return true;
          }

          return (
            input.items.find(
              (item) => item.checked && item.value === entry.toString()
            ) !== undefined || checkedCount === 0
          );
        }
        // Range filter
        if (isRangeInput(input)) {
          const { min, max } = input;
          if (min === null && max === null) {
            return true;
          }
          const numericEntry =
            entry instanceof Date ||
            typeof entry === 'number' ||
            typeof entry === 'string'
              ? new Date(entry).getTime()
              : entry;
          if (typeof numericEntry === 'number') {
            if (min !== null && max !== null) {
              return min <= numericEntry && numericEntry <= max;
            }
            if (min !== null) {
              return min <= numericEntry;
            }
            if (max !== null) {
              return numericEntry <= max;
            }
          }

          return false;
        }
        // Select filter
        if (isDropdownInput(input)) {
          const dropdownOptionEntry =
            filter.getFilterIdentifier?.(row[column]) ?? row[column];
          return (
            dropdownOptionEntry === input.selected ||
            input.selected === null ||
            input.selected === ''
          );
        }
        return true;
      });
    return keepFields.length === columns.length ? [{ key, row }] : [];
  });
};
