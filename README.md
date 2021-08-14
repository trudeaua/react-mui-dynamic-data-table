# react-mui-dynamic-data-table

[![npm version](https://badge.fury.io/js/react-mui-dynamic-data-table.svg)](https://badge.fury.io/js/react-mui-dynamic-data-table)
[![npm](https://img.shields.io/npm/dt/react-mui-dynamic-data-table.svg)](https://npm-stat.com/charts.html?package=react-mui-dynamic-data-table)
[![npm](https://img.shields.io/npm/l/react-mui-dynamic-data-table)](https://www.npmjs.com/package/react-mui-dynamic-data-table)

A dynamic data table component for React that uses Material UI.

## Features

- Sortable columns
- Pagination
- Searching
- Filtering via modal, defined in column definitions
  - Checkbox inputs (default)
  - Range inputs for numbers and dates
  - Dropdown inputs
- Row selection (single + multi select)
- Row actions and events (click, edit, and open buttons)
- Custom rendering

## Installation

You can install this package with either `npm` or `yarn` using either of the following commands

```
npm install react-mui-dynamic-data-table
```

```
yarn add react-mui-dynamic-data-table
```

## Usage

### Basic usage

```typescript
import { MuiDynamicDataTable } from 'react-mui-dynamic-data-table';

const data = [
  { firstName: 'Bob', lastName: 'Smith', age: 24 },
  { firstName: 'Alice', lastName: 'Thompson', age: 26 },
];

export function App() {
    return (
        <MuiDynamicDataTable
            columns={[
                {
                    name: 'firstName',
                    title: 'First name',
                },
                {
                    name: 'lastName',
                    title: 'Last name',
                },
                {
                    name: 'age',
                    title: 'Age',
                },
            ]}
            data={data}
    )>
}
```

### Searching

Enable sorting within `options` to sort columns.

```typescript
    options={{
        search: {
            enabled: true,
            placeholder: 'Search items...'
        }
    }}
```

### Column sorting

Enable searching within `options` to search within the the table.

```typescript
    options={{
        sort: {
            enabled: true,
            by: 'firstName'
        }
    }}
```

### Filtering

Enable filtering within `options` to allow filtering, and set `canFilter` on each column definition to enable that column to be filtered.

Set the `style` property of the column definition to control to type of component rendered in the filter modal for the column.

```typescript
    columns={[
        {
            name: 'firstName',
            title: 'First name',
            style: 'default', // Checkbox component
            canFilter: true
        },
        {
            name: 'lastName',
            title: 'Last name',
            style: 'select', // Select/dropdown component
            canFilter: true
        },
        {
            name: 'age',
            title: 'Age',
            style: 'number', // Number range component
            canFilter: true
        },
    ]}
    options={{
        filter: {
            enabled: true,
        }
    }}
```

### Custom rendering

You can render an entry as a React Node using `getRenderedEntry` in the column definitions. This should be used in conjunction with `getSearchEntry` when searching is enabled.

**Note** `getRenderedEntry` and `getSearchEntry` are especially useful for rendering JSON-like objects. See the [code sandbox](https://codesandbox.io/s/brave-goldwasser-cf6v3?file=/src/App.tsx) for a more complex example.

```typescript
    columns={[
        {
            name: 'firstName',
            title: 'First name',
            style: 'select',
            getSearchEntry: (firstName) => firstName,
            getRenderedEntry: (firstName) => <span style={{color: 'red'}}>{firstName}</span> // Text is red on table and filter modal
            canFilter: true,
        },
    ]}
```

### Row events

You can customize what happens when a row is clicked by defining a callback for `onRowClick`.

```typescript
const handleRowClick = (row) => {
    console.log(row);
}
return (
    <MuiDynamicDataTable
        ...
        onRowClick={handleRowClick}
    >
    )
```

### Row actions

You can choose to show action buttons in the table for editing and opening a row.

```typescript
const handleEdit = (row) => {
    console.log(row);
}
const handleOpen = (row) => {
    console.log(row);
}
return (
    <MuiDynamicDataTable
        ...
        options={{
            edit: {
                show: true,
                onClick: handleEdit,
            },
            open: {
                show: true,
                onClick: handleOpen,
            }
        }}
    >
    )
```

### Asynchronous data

If your data is fetched asynchronously, you can choose to show a loading indicator while the data is being fetched.

```typescript
type DataType = {firstName: string, lastName: string, age: number};
const [loading, setLoading] = useState();
const [data, setData] = useState<DataType>();

useEffect(() => {
    async function getData() {
        setLoading(true);
        const response = await fetchData();
        setData(response);
        setLoading(false);
    }
    getData();
}, [])

return (
    <MuiDynamicDataTable
        columns={columns}
        data={data}
        loading={{loading}}
    >
    )
```

## Code sample and live demo

Check out the [code sandbox](https://codesandbox.io/s/brave-goldwasser-cf6v3?file=/src/App.tsx) for a live demo, or clone the example application under `/example`.
