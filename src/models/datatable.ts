export interface DropdownItem {
  /**
   * Value of the item
   */
  value: string;
  /**
   * Item to render
   */
  node: React.ReactNode;
}

export interface CheckboxItem extends DropdownItem {
  /**
   * Indicates whether the checkbox is check or not
   */
  checked: boolean;
}

interface RenderOptions {
  /**
   * Disable using `getRenderedEntry` to render entries in a table
   */
  disableTable?: boolean;
  /**
   * Disable using `getRenderedEntry` to render entries in the filter modal
   */
  disableFilterModal?: boolean;
}

export interface RangeInput {
  /**
   * Lower bound on the range
   */
  min: number | null;
  /**
   * Upper bound on the range
   */
  max: number | null;
}

export interface CheckboxInput {
  /**
   * Items to display in the dropdown
   */
  items: CheckboxItem[];
  /**
   * Options for rendering entries in the column
   */
  rendering?: RenderOptions;
}

export interface DropdownInput {
  /**
   * Items to display in the dropdown
   */
  items: DropdownItem[];
  /**
   * Indicates which item in the dropdown is selected
   */
  selected: number | string | null;
  /**
   * Options for rendering entries in the column
   */
  rendering?: RenderOptions;
}

export type Filters<T extends DataTableRecord> = {
  [K in keyof T]: {
    /**
     * Defines the style of the input displayed when filtering items
     */
    style?: 'date' | 'datetime' | 'default' | 'number' | 'select' | 'time';
    /**
     * Options for displaying an input element on a filter modal
     */
    input: CheckboxInput | DropdownInput | RangeInput;
    /**
     * Callback for rendering the item
     */
    getRenderedEntry?: (value: T[K]) => React.ReactNode;
    /**
     * Callback for getting the item's search text
     */
    getSearchEntry?: (value: T[K]) => string;
    /**
     * Callback for the item's unique identifier
     */
    getFilterIdentifier?: (value: T[K]) => string;
  };
};

export type DataTableColumn<T extends DataTableRecord> = {
  [K in keyof T]: {
    /**
     * Unique name of the column
     */
    name: K;
    /**
     * Displayed title of the column
     */
    title?: string;
    /**
     * Style that the entries will be shown in on the table and filter modal.
     *
     * `select` will only be used to render a dropdown input on the filter modal.
     *
     * `date`, `datetime`, `time`, and `number` will render a range picker
     */
    style?: 'date' | 'datetime' | 'default' | 'number' | 'select' | 'time';
    /**
     * Can the column be filtered?
     */
    canFilter?: boolean;
    /**
     * Options for rendering entries in the column
     */
    rendering?: RenderOptions;
    /**
     * Callback for rendering the item in the data table and in the filter modal
     */
    getRenderedEntry?: (value: T[K]) => React.ReactNode;
    /**
     * Callback for getting the item's search text when searching
     */
    getSearchEntry?: (value: T[K]) => string;
    /**
     * Callback for getting the item's unique identifier used in filtering
     *
     * @description Should be set if the column style is `'default'` (checkboxes) or `'select'` and the column elements are JSON-like objects
     */
    getFilterIdentifier?: (value: T[K]) => string;
    /**
     * Custom sorting function for sorting column entries
     */
    sort?: (valueA: T[K], valueB: T[K]) => number;
  };
}[keyof T];

export type DataTableType =
  | Date
  | React.ReactNode
  | Record<string, unknown>
  | null;

export type DataTableRecord = Record<string, DataTableType>;
