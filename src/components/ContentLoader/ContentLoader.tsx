import { CircularProgress } from '@material-ui/core';
import Box from '@material-ui/core/Box/Box';
import { useTheme } from '@material-ui/core/styles';
import React from 'react';
import type { FC } from 'react';

interface ContentLoaderProps {
  /**
   * Indicates whether the loading spinner should be shown instead of the content
   */
  loading: boolean;
}

/**
 * Displays a loading spinner while `props.loading = true`
 */
const ContentLoader: FC<ContentLoaderProps> = (props) => {
  const { loading, children } = props;
  const theme = useTheme();
  // eslint-disable-next-line react/jsx-no-useless-fragment
  if (!loading) return <>{children}</>;

  return (
    <Box
      sx={{
        color: theme.palette.primary.main,
        display: 'flex',
        flexDirection: 'column',
        p: 0,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        height: 'auto',
      }}
    >
      <CircularProgress />
    </Box>
  );
};

export default ContentLoader;
