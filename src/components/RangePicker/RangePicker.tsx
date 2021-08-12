import Box from '@material-ui/core/Box/Box';
import TextField from '@material-ui/core/TextField/TextField';
import DatePicker from '@material-ui/lab/DatePicker/DatePicker';
import DateTimePicker from '@material-ui/lab/DateTimePicker/DateTimePicker';
import TimePicker from '@material-ui/lab/TimePicker/TimePicker';
import moment from 'moment';
import React from 'react';

type Range = [number | null, number | null];

interface RangePickerProps {
  /**
   * Callback for handling when the range changes
   */
  onChange?: (range: Range) => void;
  /**
   * Callback for handling when one of the inputs loses focus
   */
  onBlur?:
    | React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>
    | undefined;
  /**
   * Low value of the range
   */
  minValue?: Date | number | null;
  /**
   * High value of the range
   */
  maxValue?: Date | number | null;
  /**
   * Label for the low value input
   */
  minLabel?: string;
  /**
   * Label for the high value input
   */
  maxLabel?: string;
  /**
   * Mode of the range picker
   */
  mode: 'date' | 'datetime' | 'number' | 'time';
  /**
   * Any errors for the field
   */
  errors?: { start?: string; end?: string };
  /**
   * Has the field been touched?
   */
  touched?: boolean;
  /**
   * Name of the range picker field
   */
  name?: string;
}

/**
 * Get an input component for date-time related modes
 * @param mode Mode of the input
 * @returns An input component relevant to the mode
 */
const getPickerComponent = (mode: 'date' | 'datetime' | 'time') => {
  switch (mode) {
    case 'time':
      return TimePicker;
    case 'datetime':
      return DateTimePicker;
    case 'date':
    default:
      return DatePicker;
  }
};

/**
 * Range picker component that supports multiple modes
 */
export default function RangePicker({
  onChange,
  onBlur,
  minValue = null,
  maxValue = null,
  minLabel = 'Start',
  maxLabel = 'End',
  errors,
  touched,
  name,
  mode = 'date',
}: RangePickerProps) {
  const PickerComponent = mode === 'number' ? null : getPickerComponent(mode);
  const maxValueNumber =
    maxValue instanceof Date ? maxValue.getTime() : maxValue;
  const minValueNumber =
    minValue instanceof Date ? minValue.getTime() : minValue;
  return (
    <Box
      mb={1}
      sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}
    >
      <Box sx={{ minWidth: 100, width: '100%', mt: '0.5em' }}>
        {PickerComponent ? (
          <PickerComponent
            label={minLabel}
            onChange={(newMin: Date | number | null) => {
              if (newMin !== null) {
                newMin =
                  mode === 'date'
                    ? moment(newMin).startOf('day').toDate().getTime()
                    : new Date(newMin).getTime();
              }
              const newMax =
                // eslint-disable-next-line no-nested-ternary
                maxValueNumber === null
                  ? null
                  : mode === 'date'
                  ? moment(maxValueNumber).endOf('day').toDate().getTime()
                  : maxValueNumber;
              let newRange: Range = [null, null];
              if (
                newMin !== null &&
                ((newMax !== null && moment(newMin).isAfter(newMax)) ||
                  newMax === null)
              ) {
                newRange = [newMin, newMin];
              } else {
                newRange = [newMin, newMax];
              }
              onChange?.(newRange);
            }}
            renderInput={(inputProps) => (
              <TextField
                {...inputProps}
                error={Boolean(touched && errors?.start)}
                fullWidth
                helperText={touched && errors?.start}
                id={`${name}--start`}
                name={name}
                onBlur={onBlur}
                variant="outlined"
              />
            )}
            value={minValueNumber}
          />
        ) : (
          <TextField
            InputProps={{ inputProps: { min: 0 } }}
            error={Boolean(touched && errors?.start)}
            helperText={touched && errors?.start}
            id={`${name}--start`}
            label={minLabel}
            name={name}
            onBlur={onBlur}
            onChange={(event) => {
              const newMin = Number(event.target.value);
              let newRange: Range = [null, null];
              if (maxValueNumber === null) {
                newRange = [newMin, newMin];
              } else if (newMin > maxValueNumber) {
                newRange = [newMin, newMin];
              } else {
                newRange = [newMin, maxValueNumber];
              }
              onChange?.(newRange);
            }}
            sx={{ width: '100%' }}
            type="number"
            value={minValueNumber ?? ''}
          />
        )}
      </Box>
      <Box sx={{ minWidth: 100, width: '100%' }}>
        {PickerComponent ? (
          <PickerComponent
            label={maxLabel}
            onChange={(newMax: Date | number | null) => {
              if (newMax !== null) {
                newMax =
                  mode === 'date'
                    ? moment(newMax).endOf('day').toDate().getTime()
                    : new Date(newMax).getTime();
              }
              let newRange: Range = [null, null];
              const newMin =
                // eslint-disable-next-line no-nested-ternary
                minValueNumber === null
                  ? null
                  : mode === 'date'
                  ? moment(minValueNumber).startOf('day').toDate().getTime()
                  : minValueNumber;
              if (
                newMin !== null &&
                newMax !== null &&
                moment(newMax).isBefore(newMin)
              ) {
                newRange = [newMax, newMax];
              } else {
                newRange = [newMin, newMax];
              }
              onChange?.(newRange);
            }}
            renderInput={(inputProps) => (
              <TextField
                {...inputProps}
                error={Boolean(touched && errors?.end)}
                fullWidth
                helperText={touched && errors?.end}
                id={`${name}--end`}
                name={name}
                onBlur={onBlur}
                variant="outlined"
              />
            )}
            value={maxValueNumber}
          />
        ) : (
          <TextField
            InputProps={{ inputProps: { min: 0 } }}
            error={Boolean(touched && errors?.end)}
            helperText={touched && errors?.end}
            id={`${name}--end`}
            label={maxLabel}
            name={name}
            onBlur={onBlur}
            onChange={(event) => {
              const newMax = Number(event.target.value);
              let newRange: Range = [null, null];
              if (minValueNumber !== null && newMax < minValueNumber) {
                newRange = [newMax, newMax];
              } else {
                newRange = [minValueNumber, newMax];
              }
              onChange?.(newRange);
            }}
            sx={{ width: '100%' }}
            type="number"
            value={maxValueNumber ?? ''}
          />
        )}
      </Box>
    </Box>
  );
}
