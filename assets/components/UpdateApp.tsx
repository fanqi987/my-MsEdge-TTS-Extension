import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Box, Container, CssBaseline, IconButton, Link, Paper, Typography, Button, List, ListItem, ListItemIcon, ListItemText, Divider, Tooltip } from '@mui/material';
import { useTheme, ThemeProvider, createTheme } from '@mui/material/styles';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import { storage } from '#imports';

const ColorModeContext = createContext({ toggleColorMode: () => { } });
const colorModeItem = storage.defineItem<'light' | 'dark'>('local:colorMode', { defaultValue: 'light' });

function UpdateApp() {
    const theme = useTheme();
    const colorMode = useContext(ColorModeContext);
    const [version, setVersion] = useState('');

    useEffect(() => {
        setVersion(browser.runtime.getManifest().version);
    }, []);

    const handleOpenReader = () => {
        const readerUrl = browser.runtime.getURL('/reader.html');
        browser.tabs.create({ url: readerUrl, active: true });
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                py: 4,
            }}
        >
            <CssBaseline />
            
            <Container maxWidth="md">
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <VolumeUpIcon sx={{ color: 'white', fontSize: 32 }} />
                        <Typography variant="h5" sx={{ color: 'white', fontWeight: 600, letterSpacing: '-0.5px' }}>
                            MS Edge TTS
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title={theme.palette.mode === 'dark' ? 'Light mode' : 'Dark mode'}>
                            <IconButton
                                onClick={colorMode.toggleColorMode}
                                sx={{
                                    bgcolor: 'rgba(255,255,255,0.15)',
                                    backdropFilter: 'blur(10px)',
                                    color: 'white',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }
                                }}
                            >
                                {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {/* Main Card */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        borderRadius: 4,
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(30,30,50,0.9)' : 'rgba(255,255,255,0.95)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                    }}
                >
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <NewReleasesIcon sx={{ fontSize: 60, color: theme.palette.primary.main, mb: 2 }} />
                        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                            Welcome to version {version}
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                            We've added some great new features to enhance your reading experience.
                        </Typography>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        What's New:
                    </Typography>

                    <List sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 2 }}>
                        <ListItem>
                            <ListItemIcon>
                                <OpenInNewIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText 
                                primary="Open Reader in a New Tab" 
                                secondary="You can now open the reader in a dedicated tab for a better reading experience." 
                            />
                        </ListItem>
                        <Divider component="li" />
                        <ListItem>
                            <ListItemIcon>
                                <VolumeUpIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText 
                                primary="Read in Background" 
                                secondary="Audio playback now continues in the background when using the reader tab." 
                            />
                        </ListItem>
                         <Divider component="li" />
                        <ListItem alignItems="flex-start">
                            <ListItemIcon>
                                <KeyboardIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText 
                                primary="Customizable Keyboard Shortcuts" 
                                secondary={
                                    <Box component="span">
                                        You can now customize the keyboard shortcuts.
                                        <Box sx={{ mt: 1 }}>
                                        {import.meta.env.FIREFOX ?
                                          <>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                                Default: <b>Ctrl+Shift+F</b> (Mac: <b>Command+Shift+F</b>)
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Follow <Link href="https://support.mozilla.org/en-US/kb/manage-extension-shortcuts-firefox" underline="hover" target="_blank" rel="noopener noreferrer">Mozilla's instructions</Link> to change the hotkey
                                            </Typography>
                                          </> :
                                          <>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                                Default: <b>Ctrl+Shift+S</b> (Mac: <b>Command+Shift+S</b>)
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Open <Box component="span" sx={{ fontFamily: 'monospace', backgroundColor: theme.palette.mode === 'dark' ? '#2a3441' : '#e0e0e0', px: 0.5, py: 0.25, borderRadius: '4px' }}>chrome://extensions/shortcuts</Box>
                                                {" "}in a new tab to change the hotkey
                                            </Typography>
                                          </>
                                        }
                                        </Box>
                                    </Box>
                                } 
                            />
                        </ListItem>
                    </List>

                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleOpenReader}
                            endIcon={<OpenInNewIcon />}
                            sx={{ 
                                py: 1.5,
                                px: 4,
                                borderRadius: 2,
                                fontSize: '1rem',
                                fontWeight: 600,
                                textTransform: 'none',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)',
                                }
                            }}
                        >
                            Open Reader
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}

export default function ToggleColorMode() {
    const [mode, setMode] = useState<'light' | 'dark'>('light');
    const colorMode = useMemo(
        () => ({
            toggleColorMode: () => {
                setMode((prevMode) => {
                    const currentMode = prevMode === 'light' ? 'dark' : 'light';
                    colorModeItem.setValue(currentMode);
                    return currentMode;
                });
            },
        }),
        [],
    );

    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode,
                },
                typography: {
                    fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif',
                },
                components: {
                    MuiButton: {
                        styleOverrides: {
                            contained: {
                                color: 'white',
                            }
                        },
                    },
                }
            }),
        [mode],
    );

    useEffect(() => {
        (async () => {
            const colorModeValue = await colorModeItem.getValue();
            setMode(colorModeValue);
        })();
    }, []);

    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                <UpdateApp />
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
}

