import type {
  DataTableType,
  DataTableColumn,
  DataTableRecord,
  Filters,
} from '../../models/datatable';
import { filterData } from '../../utils/datatable';
import { formatDate } from '../../utils/format';
import { isDict } from '../../utils/isDict';
import { escapeRegExp } from '../../utils/regex';
import { ContentLoader } from '../ContentLoader';
import FilterButton from '../FilterButton';
import { Scrollbar } from '../Scrollbar';
import {
  Badge,
  Box,
  Card,
  CardHeader,
  Divider,
  IconButton,
  InputAdornment,
  Radio,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@material-ui/core';
import Checkbox from '@material-ui/core/Checkbox/Checkbox';
import { ArrowForward, Search, Edit, DeleteForever } from '@material-ui/icons';
import React, {
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

/**
 * Convert a datatable entry into a string
 * @param value Datatable entry
 * @param style Style that the entry should be shown in
 * @returns A string representing the datatable entry
 */
const dataString = (value: DataTableType, style?: string) => {
  if (
    (typeof value === 'number' ||
      value instanceof Date ||
      typeof value === 'string') &&
    (style === 'date' || style === 'datetime' || style === 'time')
  ) {
    return formatDate({ date: value, formatter: style, utc: false });
  }
  if (isValidElement(value)) return value;
  if (typeof value === 'object') return '-';
  return (value ?? '') === '' ? '-' : String(value);
};

/**
 * Render a datatable entry using the column's render function
 * @returns A node or string representing the datatable entry
 */
const renderEntry = ({
  render,
  value,
  style,
}: {
  style?: string;
  value: DataTableType;
  render?: (value: DataTableType) => React.ReactNode;
}) => {
  if (render instanceof Function) {
    return render(value);
  }
  return dataString(value, style);
};

interface TableOptions<T extends DataTableRecord> {
  /**
   * Options for the actions column. Leaving this undefined will not render the actions column.
   */
  actions?: {
    /**
     * Options for the edit action
     */
    edit?: {
      /**
       * Indicates whether the action button should be shown or not
       */
      show: boolean;
      /**
       * Callback for handling clicking the action button
       */
      onClick: (row: T) => void;
      /**
       * Icon for edit action
       */
      icon?: JSX.Element;
    };
    open?: {
      /**
       * Indicates whether the action button should be shown or not
       */
      show: boolean;
      /**
       * Callback for handling clicking the action button
       */
      onClick: (row: T) => void;
      /**
       * Icon for open action
       */
      icon?: JSX.Element;
    };
    delete?: {
      /**
       * Indicates whether the action button should be shown or not
       */
      show: boolean;
      /**
       * Callback for handling clicking the action button
       */
      onClick: (row: T) => void;
      /**
       * Icon for delete action
       */
      icon?: JSX.Element;
    };
  };
  /**
   * Options for the table header
   */
  header?: {
    /**
     * Options for a coloured badge in the top right corner of the table
     */
    badge?: {
      /**
       * Indicates whether the badge should be shown or not
       */
      show: boolean;
      /**
       * Colour of the badge. Defaults to the main colour of the current theme's primary palette.
       */
      color?: string;
    };
    /**
     * Options for table actions in the top right corner
     */
    actions?: {
      /**
       * Indicates whether the actions should be shown or not
       */
      show: boolean;
      /**
       * Actions node to show
       */
      node: React.ReactNode;
    };
  };
  /**
   * Options for sorting the table's data
   */
  sort?: {
    /**
     * Indicates whether sorting is enabled or not
     */
    enabled?: boolean;
    /**
     * Column name to sort by
     */
    by?: string;
    /**
     * Sort order
     */
    order?: 'asc' | 'desc';
  };
  /**
   * Options for searching the table's data
   */
  search?: {
    /**
     * Indicates whether searching is enabled or not
     */
    enabled?: boolean;
    /**
     * Search input placeholder
     */
    placeholder?: string;
  };
  /**
   * Options for filtering the table's data
   */
  filter?: {
    /**
     * Indicates whether filtering is enabled or not
     */
    enabled?: boolean;
  };
  /**
   * Options for selecting rows
   */
  select?: {
    /**
     * Is radio selection enabled?
     */
    enabled?: boolean;
    /**
     * Callback that fires when a row is selected.
     *
     * All selected rows are passed as the arg.
     */
    onSelect?: (selected: number[]) => void;
    /**
     * Defines what input to render in each row.
     *
     * If set to `multiple`, multiple rows can be selected. `single` only allows a single row to be selected.
     */
    mode: 'multiple' | 'single';
    /**
     * Defines already selected rows.
     *
     * Useful for maintaining table state across page renders
     */
    selected?: number[];
  };
  noData?: {
    /**
     * Message to show when there is no data in the table
     *
     * @default 'No data'
     */
    message?: string;
  };
}
interface TableProps<T extends DataTableRecord> {
  /**
   * Table options
   */
  options?: TableOptions<T>;
  /**
   * Table data
   */
  data: T[];
  /**
   * Table columns
   */
  columns: DataTableColumn<T>[];
  /**
   * Title to show in the table header
   */
  title?: string;
  /**
   * Callback for when a table row is clicked
   */
  onRowClick?: (clicked: T) => void;
  /**
   * Indicates data is being loaded
   */
  loading?: boolean;
}

/**
 * Retrieve and apply the user's row number selection from local storage
 * @returns The user's row number selection from their last session, if any
 */
const retrieveRowsPerPage = () => {
  let rowsPerPage: number | null = null;

  const storedRows: string | null = window.localStorage.getItem('rowsPerPage');
  if (storedRows) {
    rowsPerPage = JSON.parse(storedRows) as number;
  }
  return rowsPerPage;
};

/**
 * Store the user's row number selection in local storage
 * @param rowsPerPage User's current row number selection
 */
const storeRowsPerPage = (rowsPerPage: number): void => {
  window.localStorage.setItem('rowsPerPage', JSON.stringify(rowsPerPage));
};

const messages = {
  actions: 'Actions',
};

function DataTable<T extends DataTableRecord>({
  options,
  data: masterData = [],
  columns,
  title,
  onRowClick,
  loading = false,
}: TableProps<T>) {
  const theme = useTheme();

  const [sortingBy, setSortingBy] = useState(
    options?.sort?.by ?? (columns.length > 0 ? columns[0].name : '')
  );
  const [sortingOrder, setSortingOrder] = useState<'asc' | 'desc'>(
    options?.sort?.order ?? 'desc'
  );
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);
  const [selectedRows, setSelectedRows] = useState<number[]>(
    options?.select?.selected ?? []
  );

  const handleEditClick = options?.actions?.edit?.onClick;
  const handleOpenClick = options?.actions?.open?.onClick;
  const handleDeleteClick = options?.actions?.delete?.onClick;
  const handleRowClick = onRowClick;
  const [filters, setFilters] = useState<Filters<T> | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const retrieveRows = retrieveRowsPerPage();

    if (retrieveRows) {
      setRowsPerPage(retrieveRows);
    }
  }, []);

  useEffect(() => {
    setSelectedRows(options?.select?.selected ?? []);
  }, [options?.select?.selected]);

  const idData = useMemo(
    () => masterData.map((row, index) => ({ row, key: index })),
    [masterData]
  );

  const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (options?.select?.mode !== 'single') {
      return;
    }
    const { value } = event.target;
    const newSelected = Number(value);
    options.select?.onSelect?.([newSelected]);
    setSelectedRows([newSelected]);
  };

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (options?.select?.mode !== 'multiple') {
      return;
    }
    const { checked, value } = event.target;
    const newSelected = Number(value);
    const newSelectedRows = [...selectedRows];
    if (checked) {
      newSelectedRows.push(newSelected);
    } else {
      newSelectedRows.splice(newSelectedRows.indexOf(newSelected), 1);
    }
    options.select?.onSelect?.(newSelectedRows);
    setSelectedRows(newSelectedRows);
  };

  // Sort data
  const sortByKey = (sortBy?: string) => {
    if (!sortBy) {
      return;
    }
    setSortingBy(sortBy);
    setSortingOrder(
      sortingOrder === 'desc' || sortBy !== sortingBy ? 'asc' : 'desc'
    );
  };

  const sortData = useCallback(
    (a: { row: T; key: number }, b: { row: T; key: number }) => {
      const valueA = a.row[sortingBy];
      const valueB = b.row[sortingBy];
      const column = columns.find((c) => c.name === sortingBy);

      if (!column) {
        return -1;
      }

      // Dates
      if (column.style === 'date' || column.style === 'datetime') {
        let cmprA = valueA;
        let cmprB = valueB;

        if (sortingOrder === 'asc') {
          cmprA = valueB;
          cmprB = valueA;
        }

        if (
          !(
            cmprA instanceof Date ||
            typeof cmprA === 'number' ||
            typeof cmprA === 'string'
          )
        ) {
          return 1;
        }
        if (
          !(
            cmprB instanceof Date ||
            typeof cmprB === 'number' ||
            typeof cmprB === 'string'
          )
        ) {
          return -1;
        }

        return new Date(cmprA).getTime() - new Date(cmprB).getTime();
      }

      if (column.style === 'time') {
        let cmprA = valueA;
        let cmprB = valueB;

        if (sortingOrder === 'asc') {
          cmprA = valueB;
          cmprB = valueA;
        }

        if (
          !(
            cmprA instanceof Date ||
            typeof cmprA === 'number' ||
            typeof cmprA === 'string'
          )
        ) {
          return 1;
        }
        if (
          !(
            cmprB instanceof Date ||
            typeof cmprB === 'number' ||
            typeof cmprB === 'string'
          )
        ) {
          return -1;
        }

        const today = new Date();
        const date1 = new Date(cmprB);
        const date2 = new Date(cmprA);

        date1.setDate(today.getDate());
        date1.setMonth(today.getMonth());
        date1.setFullYear(today.getFullYear());

        date2.setDate(today.getDate());
        date2.setMonth(today.getMonth());
        date2.setFullYear(today.getFullYear());

        return new Date(date2).getTime() - new Date(date1).getTime();
      }

      // Numbers
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return (sortingOrder === 'asc' ? 1 : -1) * (valueB - valueA);
      }

      // JS Objects
      if (column?.sort !== undefined && isDict(valueA) && isDict(valueB)) {
        let value = 0;
        value = column.sort(valueA as T[keyof T], valueB as T[keyof T]);
        return sortingOrder === 'asc' ? value : value * -1;
      } else if (
        column.getSearchEntry &&
        !(valueB instanceof Date || valueA instanceof Date) &&
        !React.isValidElement(valueB) &&
        !React.isValidElement(valueA) &&
        typeof valueB === 'object' &&
        typeof valueA === 'object' &&
        !Array.isArray(valueB) &&
        !Array.isArray(valueA) &&
        valueB !== null &&
        valueA !== null
      ) {
        const keyValueA = column.getSearchEntry(valueA as T[keyof T]);
        const keyValueB = column.getSearchEntry(valueB as T[keyof T]);
        if (typeof keyValueA === 'number' && typeof keyValueB === 'number') {
          return (sortingOrder === 'asc' ? 1 : -1) * (keyValueB - keyValueA);
        }
        return (
          (sortingOrder === 'asc' ? 1 : -1) *
          String(keyValueB).localeCompare(String(keyValueA))
        );
      }

      // Strings
      return (
        (sortingOrder === 'asc' ? 1 : -1) *
        String(valueB).localeCompare(String(valueA))
      );
    },
    [columns, sortingBy, sortingOrder]
  );

  const searchData = useCallback(
    (input: string, data?: { key: number; row: T }[]) => {
      const escapedInput = escapeRegExp(input);
      const toReturn = (data ?? idData).filter(
        ({ row }) =>
          columns.filter(
            ({ name, style, getRenderedEntry, getSearchEntry }) => {
              const raw = row[name];
              const rawValue = dataString(raw, style);
              let value = '';
              if (
                typeof rawValue === 'string' &&
                !(
                  getRenderedEntry instanceof Function &&
                  typeof raw === 'object'
                )
              ) {
                value = rawValue.replace(/\s/gu, '').toLocaleLowerCase();
              }
              if (getSearchEntry) {
                const rawStr = getSearchEntry(raw);
                value = rawStr.replace(/\s/gu, '').toLocaleLowerCase();
              }
              const match = new RegExp(`${escapedInput}`, 'u').test(value);
              return match;
            }
          ).length > 0
      );
      // Change page based on num entries in data
      const newPage = Math.floor(toReturn.length / rowsPerPage);
      if (newPage < page) {
        setPage(newPage);
      }
      return toReturn;
    },
    [columns, idData, page, rowsPerPage]
  );

  const handleSearchChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const input = event.target.value.toLocaleLowerCase().replace(/\s/gu, '');
    if (input.length < 1) {
      setQuery('');
      return;
    }
    setQuery(input);
  };

  const tableData = useMemo(
    () => filterData(searchData(query, idData), filters),
    [filters, idData, query, searchData]
  );

  const displayData = useMemo(
    () =>
      tableData
        .sort(sortData)
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [page, rowsPerPage, sortData, tableData]
  );

  const colsCanFilter = columns.filter(({ canFilter }) => canFilter);

  return (
    <Box
      sx={{
        backgroundColor: 'background.default',
      }}
    >
      <Card>
        {title && (
          <CardHeader
            action={
              options?.header?.actions?.show && (
                <Box>{options?.header?.actions?.node}</Box>
              )
            }
            avatar={
              options?.header?.badge?.show && (
                <Badge
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                  badgeContent=" "
                  sx={{
                    '& .MuiBadge-badge': {
                      backgroundColor:
                        options.header.badge.color ??
                        theme.palette.primary.main,
                      left: 10,
                      top: 11,
                      width: 15,
                      height: 15,
                      minWidth: 15,
                    },
                    width: 15,
                    height: 20,
                  }}
                />
              )
            }
            title={title}
          />
        )}
        {(options?.search?.enabled || options?.filter?.enabled) && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box
              sx={{
                alignItems: 'center',
                display: 'flex',
                flexWrap: 'wrap',
                m: -1,
                p: 2,
                flex: '1 1 0',
              }}
            >
              {options?.search?.enabled && (
                <Box
                  sx={{
                    m: 1,
                    maxWidth: 500,
                    display: 'flex',
                    flex: '1 1 0',
                  }}
                >
                  <TextField
                    InputProps={{
                      startAdornment: (
                        <InputAdornment
                          position="start"
                          sx={{
                            color:
                              theme.palette.mode === 'light'
                                ? theme.palette.grey['700']
                                : theme.palette.grey['400'],
                          }}
                        >
                          <Search color="inherit" fontSize="medium" />
                        </InputAdornment>
                      ),
                    }}
                    fullWidth
                    onChange={handleSearchChange}
                    placeholder={options.search.placeholder ?? 'Search items'}
                    variant="outlined"
                  />
                </Box>
              )}
              {options?.filter?.enabled && colsCanFilter.length > 0 && (
                <Box>
                  <FilterButton
                    columns={colsCanFilter}
                    data={masterData}
                    onChange={setFilters}
                  />
                </Box>
              )}
            </Box>
            {!title && options?.header?.actions?.show && (
              <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
                {options?.header?.actions?.node}
              </Box>
            )}
          </Box>
        )}
        <Divider />
        <Scrollbar>
          <Table>
            <TableHead>
              <TableRow>
                {options?.select?.enabled && <TableCell padding="checkbox" />}
                {columns.map(({ name, title }) => (
                  <TableCell
                    key={`table-column-${name}`}
                    onClick={() => {
                      if (options?.sort?.enabled) {
                        sortByKey(name.toString());
                      }
                    }}
                  >
                    {options?.sort?.enabled ? (
                      <Tooltip enterDelay={300} title="Sort">
                        <TableSortLabel
                          active={sortingBy === name}
                          direction={sortingOrder}
                        >
                          {title}
                        </TableSortLabel>
                      </Tooltip>
                    ) : (
                      title
                    )}
                  </TableCell>
                ))}
                {options?.actions &&
                  (options.actions?.edit?.show ||
                    options.actions?.open?.show ||
                    options.actions?.delete?.show) && (
                    <TableCell align="right">{messages.actions}</TableCell>
                  )}
              </TableRow>
            </TableHead>
            <TableBody>
              {displayData.length > 0 && !loading ? (
                displayData.map(({ key, row }, i) => (
                  <TableRow
                    hover
                    key={`table-row-${i}`}
                    onClick={(e) => {
                      if (
                        (e.target as HTMLInputElement).type !== 'checkbox' &&
                        (e.target as HTMLInputElement).type !== 'radio'
                      ) {
                        handleRowClick?.(row);
                      }
                    }}
                    sx={{
                      cursor: handleRowClick ? 'pointer' : 'inherit',
                    }}
                  >
                    {options?.select?.enabled &&
                      options?.select?.mode === 'single' && (
                        <TableCell padding="checkbox">
                          <Radio
                            checked={selectedRows.includes(key)}
                            color="primary"
                            onChange={handleRadioChange}
                            value={key}
                          />
                        </TableCell>
                      )}
                    {options?.select?.enabled &&
                      options?.select?.mode === 'multiple' && (
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedRows.includes(key)}
                            color="primary"
                            onChange={handleCheckboxChange}
                            value={key}
                          />
                        </TableCell>
                      )}
                    {columns.map(
                      ({ rendering, style, name, getRenderedEntry }, j) => (
                        <TableCell
                          className={style}
                          key={`table-body-${name}-${j}`}
                        >
                          {renderEntry({
                            render: rendering?.disableTable
                              ? undefined
                              : (getRenderedEntry as
                                  | ((value: DataTableType) => React.ReactNode)
                                  | undefined),
                            value: row[name],
                            style,
                          })}
                        </TableCell>
                      )
                    )}
                    {options?.actions &&
                      (options.actions?.edit?.show ||
                        options.actions?.open?.show ||
                        options.actions?.delete?.show) && (
                        <TableCell align="right">
                          {options.actions?.edit?.show && (
                            <IconButton
                              onClick={() => handleEditClick?.(row)}
                              sx={{ color: theme.palette.text.primary }}
                            >
                              {options.actions?.edit?.icon || (
                                <Edit color="inherit" fontSize="medium" />
                              )}
                            </IconButton>
                          )}
                          {options.actions?.open?.show && (
                            <IconButton
                              onClick={() => handleOpenClick?.(row)}
                              sx={{ color: theme.palette.text.primary }}
                            >
                              {options.actions?.open?.icon || (
                                <ArrowForward
                                  color="inherit"
                                  fontSize="medium"
                                />
                              )}
                            </IconButton>
                          )}
                          {options.actions?.delete?.show && (
                            <IconButton
                              onClick={() => handleDeleteClick?.(row)}
                              sx={{ color: theme.palette.text.primary }}
                            >
                              {options.actions?.delete?.icon || (
                                <DeleteForever
                                  color="inherit"
                                  fontSize="medium"
                                />
                              )}
                            </IconButton>
                          )}
                        </TableCell>
                      )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    align="center"
                    colSpan={
                      columns.length +
                      Number(
                        Boolean(
                          options?.actions?.edit !== undefined ||
                            options?.actions?.open !== undefined
                        )
                      ) +
                      Number(Boolean(options?.select?.enabled))
                    }
                  >
                    <ContentLoader loading={loading}>
                      <Typography
                        align="center"
                        color="textSecondary"
                        variant="h6"
                      >
                        {options?.noData?.message ?? 'No data'}
                      </Typography>
                    </ContentLoader>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Scrollbar>
        <TablePagination
          component="div"
          count={tableData.length}
          onPageChange={(_event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(Number(event.target.value));
            storeRowsPerPage(Number(event.target.value));
            setPage((prevPage) =>
              Math.floor((prevPage * rowsPerPage) / Number(event.target.value))
            );
          }}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
        />
      </Card>
    </Box>
  );
}

export default DataTable;
