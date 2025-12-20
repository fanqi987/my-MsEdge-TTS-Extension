import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import { Brightness4, Brightness7, OpenInNew } from '@mui/icons-material';
import { Tooltip } from '@mui/material';

export default function ButtonAppBar(props: any) {
    const { menuClick, toggleColorMode, colorMode, onOpenReader } = props;

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar>
                    <IconButton
                        size="large"
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        sx={{ mr: 2 }}
                        onClick={menuClick}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        MS Edge TTS
                    </Typography>
                    <Tooltip title="Open Reader in New Tab">
                        <IconButton color='inherit' size='large' onClick={onOpenReader}>
                            <OpenInNew />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={colorMode === 'dark' ? 'Light mode' : 'Dark mode'}>
                        <IconButton color='inherit' size='large' onClick={toggleColorMode}>
                            {colorMode === 'dark' ? <Brightness7 /> : <Brightness4 />}
                        </IconButton>
                    </Tooltip>
                </Toolbar>
            </AppBar>
        </Box>
    );
}
