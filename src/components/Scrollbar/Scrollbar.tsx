import { Box } from '@material-ui/core';
import React, { forwardRef } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import type { ScrollBarProps as PerfectScrollbarProps } from 'react-perfect-scrollbar';

type ScrollbarProps = PerfectScrollbarProps;

const Scrollbar = forwardRef<PerfectScrollbar, ScrollbarProps>((props, ref) => {
  const { children, ...other } = props;

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/u.test(
    navigator.userAgent
  );

  if (isMobile) {
    return (
      <Box ref={ref} sx={{ overflowX: 'auto' }}>
        {children}
      </Box>
    );
  }

  return (
    <PerfectScrollbar ref={ref} {...other}>
      {children}
    </PerfectScrollbar>
  );
});

export default Scrollbar;
