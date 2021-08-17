import type {
  Filters,
  DataTableColumn,
  RangeInput,
  CheckboxInput,
  DropdownInput,
  DataTableRecord,
} from '../../models/datatable';
import {
  isCheckboxInput,
  isRangeInput,
  isDropdownInput,
} from '../../utils/datatable';
import { RangePicker } from '../RangePicker';
import { Box, Button, Checkbox, Dialog, Typography } from '@material-ui/core';
import Divider from '@material-ui/core/Divider/Divider';
import MenuItem from '@material-ui/core/MenuItem/MenuItem';
import Select from '@material-ui/core/Select/Select';
import { cloneDeep } from 'lodash';
import React, { useEffect, useState } from 'react';

interface FilterModalProps<T extends DataTableRecord> {
  /**
   * Callback for when the apply button is clicked
   */
  onApply?: (event: Filters<T>) => void;
  /**
   * Callback for when the modal is closed
   */
  onClose?: () => void;
  /**
   * Indicates whether the modal is open or not
   */
  open: boolean;
  /**
   * Filters to display on the modal
   */
  filters: Filters<T>;
  /**
   * Columns used to display the filters
   */
  columns: DataTableColumn<T>[];
}

interface Validation {
  /**
   * Were the filters cleared?
   */
  cleared?: boolean;
}

const messages = {
  apply: 'Apply',
  filter: 'Filter',
  clearFilters: 'Clear Filters',
  select: 'Select...',
};

const FilterModal = <T extends DataTableRecord>({
  onApply,
  onClose,
  open,
  filters,
  columns,
  ...other
}: FilterModalProps<T>) => {
  const [validation, setValidation] = useState<Validation>({
    cleared: false,
  });
  const [backupSelectedFilters, setBackupSelectedFilters] =
    useState<Filters<T>>(filters);
  const [selectedFilters, setSelectedFilters] = useState<Filters<T>>(filters);

  useEffect(() => {
    setSelectedFilters(filters);
  }, [filters]);

  const handleApplyFilters = (): void => {
    setValidation({ cleared: false });
    onApply?.(selectedFilters);
  };

  const handleClose = (): void => {
    const { cleared } = validation;
    // Edge case: Cleared filters and closed modal without clicking apply
    if (cleared) {
      setSelectedFilters(backupSelectedFilters);
    }
    onClose?.();
  };

  /**
   * Erase the currently selected filters
   */
  const clearFilters = (): void => {
    setValidation({ ...validation, cleared: true });
    // Backup for soft deletion
    setBackupSelectedFilters(selectedFilters);
    // Depth >= 2 requires cloneDeep, else weird stuff happens
    const clearedFilters: Filters<T> = cloneDeep(selectedFilters);
    Object.entries(clearedFilters).forEach(([key, { input }]) => {
      if (isCheckboxInput(input)) {
        input.items.forEach((option) => {
          option.checked = false;
        });
      } else if (isRangeInput(input)) {
        input.max = null;
        input.min = null;
      } else if (isDropdownInput(input)) {
        input.selected = null;
      }
      clearedFilters[key as string | keyof T] = {
        ...clearedFilters[key],
        input: { ...input },
      };
    });
    setSelectedFilters(clearedFilters);
  };

  /**
   * Find the friendly name for a column name
   * @param columnName Name of a column/filter section
   * @returns The title of the column
   */
  const lookupTitle = (columnName: string): string | undefined => {
    const column = columns.find(
      (f) => f.name === columnName || f.style === columnName
    );
    return column ? column.title : columnName;
  };

  /**
   * Handler for selecting a checkbox
   * @param value Checked state of the checkbox
   * @param columnName Name of the column that the checkboxes filter applies to
   * @param option Name of the option that was selected
   */
  const selectCheckbox = (
    checked: boolean,
    columnName: string,
    value: string
  ): void => {
    const selectedInput = selectedFilters[columnName].input;
    if (isCheckboxInput(selectedInput)) {
      const newInput: CheckboxInput = {
        ...selectedInput,
        items:
          selectedInput.items.map((item) => {
            if (item.value === value) {
              item.checked = checked;
            }
            return item;
          }) ?? [],
      };
      const sendBack = {
        ...selectedFilters,
        [columnName]: {
          ...selectedFilters[columnName],
          input: newInput,
        },
      };
      setSelectedFilters(sendBack);
    }
  };

  /**
   * Handler for changing a range input
   * @param columnName Name of the column that the range filter applies to
   * @param min Minimum value of the range
   * @param max Maximum value of the range
   */
  const setRange = (
    columnName: string,
    min: number | null,
    max: number | null
  ): void => {
    const column = columns.find((f) => f.name === columnName);
    if (!column) {
      return;
    }
    const selectedInput = selectedFilters[columnName].input;
    if (isRangeInput(selectedInput)) {
      const newInput: RangeInput = {
        ...selectedInput,
        min,
        max,
      };
      setSelectedFilters({
        ...selectedFilters,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        [column.name]: {
          ...selectedFilters[column.name],
          input: newInput,
        },
      });
    }
  };

  /**
   * Handler for changing a select input
   * @param columnName Name of the column that the select filter applies to
   * @param selected Value of the selected option
   */
  const setSelect = (
    columnName: string,
    selected: number | string | null
  ): void => {
    const column = columns.find((f) => f.name === columnName);
    if (!column) {
      return;
    }
    const selectedInput = selectedFilters[columnName].input;
    if (isDropdownInput(selectedInput)) {
      const newInput: DropdownInput = {
        ...selectedInput,
        items: selectedInput.items ?? [],
        selected,
      };
      setSelectedFilters({
        ...selectedFilters,
        [column.name]: {
          ...selectedFilters[column.name],
          input: newInput,
        },
      });
    }
  };

  return (
    <Dialog maxWidth="xl" onClose={handleClose} open={open} {...other}>
      <Box sx={{ p: 3, minWidth: 250 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <Typography
            align="left"
            color="textPrimary"
            gutterBottom
            sx={{ display: 'flex', flex: '1 1 0' }}
            variant="h4"
          >
            {messages.filter}
          </Typography>
          <Button onClick={clearFilters}>{messages.clearFilters}</Button>
        </Box>
        <Box sx={{ mt: 2 }}>
          {Object.entries(selectedFilters).flatMap(
            ([key, { style, input }]) => {
              const column = columns.find((f) => f.name === key);
              if (!column) {
                return [];
              }
              if (style === 'default' && isCheckboxInput(input)) {
                return [
                  <Box key={`section-${key}`}>
                    <Typography
                      align="left"
                      color="textSecondary"
                      gutterBottom
                      variant="overline"
                    >
                      {lookupTitle(key)}
                    </Typography>
                    <Divider />
                    {input.items.map((item, index) => (
                      <Box
                        key={`checkbox-${key}-${index}`}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Typography
                          align="left"
                          color="textPrimary"
                          gutterBottom
                          variant="subtitle2"
                        >
                          {item.node}
                        </Typography>
                        <Checkbox
                          checked={item.checked}
                          color="primary"
                          onChange={(e) => {
                            selectCheckbox(e.target.checked, key, item.value);
                          }}
                        />
                      </Box>
                    ))}
                  </Box>,
                ];
              } else if (
                (style === 'date' ||
                  style === 'datetime' ||
                  style === 'time' ||
                  style === 'number') &&
                isRangeInput(input)
              ) {
                return [
                  <Box key={`section-${key}`}>
                    <Typography
                      align="left"
                      color="textSecondary"
                      gutterBottom
                      variant="overline"
                    >
                      {lookupTitle(key)}
                    </Typography>
                    <Divider />
                    <RangePicker
                      maxValue={input.max}
                      minValue={input.min}
                      mode={style}
                      onChange={(range: [number | null, number | null]) =>
                        setRange(key, range[0], range[1])
                      }
                    />
                  </Box>,
                ];
              } else if (style === 'select' && isDropdownInput(input)) {
                return [
                  <Box key={`section-${key}`}>
                    <Typography
                      align="left"
                      color="textSecondary"
                      gutterBottom
                      variant="overline"
                    >
                      {lookupTitle(key)}
                    </Typography>
                    <Divider />
                    <Box sx={{ my: 1 }}>
                      <Select
                        displayEmpty
                        fullWidth
                        onChange={(event) =>
                          setSelect(
                            key,
                            event.target.value as number | string | null
                          )
                        }
                        placeholder={lookupTitle(key)}
                        value={input.selected ?? ''}
                        variant="outlined"
                      >
                        <MenuItem selected value="">
                          {messages.select}
                        </MenuItem>
                        {input.items.map((item, index) => (
                          <MenuItem
                            key={`dropdown-item-${index}`}
                            value={item.value}
                          >
                            {item.node}
                          </MenuItem>
                        ))}
                      </Select>
                    </Box>
                  </Box>,
                ];
              }
              return [];
            }
          )}
        </Box>
        <Box
          sx={{
            mt: 3,
            py: 3,
          }}
        >
          <Button
            color="primary"
            fullWidth
            onClick={handleApplyFilters}
            variant="contained"
          >
            {messages.apply}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

export default FilterModal;
