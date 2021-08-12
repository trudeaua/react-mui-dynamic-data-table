/**
 * Filter Button
 * General purpose record filter
 */
import type {
  DataTableColumn,
  DataTableRecord,
  Filters,
} from '../../models/datatable';
import { countFilters, createFilters } from '../../utils/datatable';
import FilterModal from '../FilterModal/FilterModal';
import { Tooltip, IconButton, Badge } from '@material-ui/core';
import TuneIcon from '@material-ui/icons/tune';
import React, { useState } from 'react';
import { useDeepCompareEffectNoCheck } from 'use-deep-compare-effect';

/**
 * Filter button for DataTable records
 */
const FilterButton = <T extends DataTableRecord>({
  data = [],
  columns = [],
  onChange,
}: {
  data: T[];
  columns: DataTableColumn<T>[];
  onChange?: (value: Filters<T>) => void;
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [filters, setFilters] = useState(createFilters(data, columns));
  const [numFilters, setNumFilters] = useState(0);

  const [open, setOpen] = useState<boolean>(false);

  useDeepCompareEffectNoCheck(() => {
    setFilters(createFilters(data, columns));
    setNumFilters(0);
  }, [columns, data]);

  // Update filters, send new items to parent
  const updateFilters = (updatedFilters: Filters<T>) => {
    setFilters(updatedFilters);
    setNumFilters(countFilters(updatedFilters));
    onChange?.(updatedFilters);
  };

  const handleOpen = (): void => {
    updateFilters(filters);
    setOpen(true);
  };

  const handleApplyFilters = (appliedFilters: Filters<T>): void => {
    updateFilters(appliedFilters);
    setOpen(false);
  };

  const handleClose = (): void => {
    setOpen(false);
  };

  return (
    <>
      <Tooltip title="Filter">
        <IconButton color="inherit" onClick={handleOpen}>
          <Badge badgeContent={numFilters} color="error">
            <TuneIcon fontSize="large" />
          </Badge>
        </IconButton>
      </Tooltip>
      <FilterModal
        columns={columns}
        filters={filters}
        onApply={handleApplyFilters}
        onClose={handleClose}
        open={open}
      />
    </>
  );
};

export default FilterButton;
