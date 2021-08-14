import './App.css';
import React from 'react';
import { MuiDynamicDataTable } from 'react-mui-dynamic-data-table';
import { Button } from '@material-ui/core';

const dataset = [
  { firstName: 'Bob', lastName: 'Price', age: 26 },
  { firstName: 'Alice', lastName: 'Smith', age: 39 },
  { firstName: 'Chuck', lastName: 'Parker', age: 12 },
  { firstName: 'Dottie', lastName: 'Simpson', age: 61 },
];

function App() {
  const handleSelect = (selected: number[]) => {
    console.log('Row selected!');
    console.log(selected);
  };
  const handleEdit = (row: typeof dataset[number]) => {
    console.log('Row edit!');
    console.log(row);
  };
  const handleOpen = (row: typeof dataset[number]) => {
    console.log('Row open!');
    console.log(row);
  };
  const handleRowClick = (row: typeof dataset[number]) => {
    console.log('Row clicked!');
    console.log(row);
  };
  return (
    <div className="App">
      <MuiDynamicDataTable
        columns={[
          { name: 'firstName', title: 'First Name', canFilter: true },
          {
            name: 'lastName',
            title: 'Last Name',
            canFilter: true,
            style: 'select',
          },
          { name: 'age', title: 'Age', canFilter: true, style: 'number' },
        ]}
        data={dataset}
        options={{
          search: {
            enabled: true,
            placeholder: 'Search users...',
          },
          sort: {
            enabled: true,
            by: 'a',
          },
          filter: {
            enabled: true,
          },
          select: {
            mode: 'multiple',
            enabled: true,
            onSelect: handleSelect,
          },
          actions: {
            edit: {
              show: true,
              onClick: handleEdit,
            },
            open: {
              show: true,
              onClick: handleOpen,
            },
          },
          header: {
            actions: {
              show: true,
              node: <Button>Click me!</Button>,
            },
            badge: {
              show: true,
              color: '#FF0000',
            },
          },
          noData: {
            message: "There's nothing!",
          },
        }}
        title="Users"
        onRowClick={handleRowClick}
      />
    </div>
  );
}

export default App;
