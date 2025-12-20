import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Box, Button, Container, CssBaseline, IconButton, Link, Paper, TextField, Tooltip, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Grid from '@mui/material/Grid';
import SnackbarAlert from '@/assets/components/SnackbarAlert';
import SelectAutocomplete from '@/assets/components/SelectAutocomplete';
import CustomSlider from '@/assets/components/CustomSlider';
import useFetch from '@/assets/custom hooks/useFetch';
import useTTS from '@/assets/custom hooks/useTTS';
import { storage } from '#imports';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { GitHub } from '@mui/icons-material';
import { useTheme, ThemeProvider, createTheme } from '@mui/material/styles';

const ColorModeContext = createContext({ toggleColorMode: () => { } });

const currentVoiceItem = storage.defineItem<Record<string, any>>('local:currentVoice');
const currentSettingsItem = storage.defineItem<Record<string, any>>('local:currentSettings');
const textItem = storage.defineItem<string>('session:text');
const colorModeItem = storage.defineItem<'light' | 'dark'>('local:colorMode', { defaultValue: 'light' });

const voiceReducer = (state: any, action: any) => {
    let currentVoice;
    switch (action.type) {
        case 'select_language':
            currentVoice = { language: action.value, country: '', voice: '' };
            break;
        case 'select_country':
            currentVoice = { ...state, country: action.value, voice: '' };
            break;
        case 'select_voice':
            currentVoice = { ...state, voice: action.value };
            break;
        case 'set_voice':
            currentVoice = { ...action.value };
            break;
        default:
            return state;
    }

    currentVoiceItem.setValue(currentVoice);
    return { ...currentVoice };
};

const textReducer = (state: any, action: any) => {
    switch (action.type) {
        case 'set_text':
            return action.value;
        default:
            return state;
    }
};

const alertReducer = (state: any, action: any) => {
    switch (action.type) {
        case 'close_alert':
            return { ...state, open: false };
        case 'voices_error':
            return { open: true, alert: { severity: 'error', msg: 'Error occured while loading voices' } };
        case 'audio_error':
            return { open: true, alert: { severity: 'error', msg: 'Error occured while generating audio' } };
        case 'generate_audio':
            return { open: true, alert: { severity: 'info', msg: 'Generating audio...', icon: 'circular-progress' } };
        case 'no_voice_selected':
            return { open: true, alert: { severity: 'warning', msg: 'Please select a voice' } };
        default:
            return state;
    }
};

const settingsReducer = (state: any, action: any) => {
    let currentSettings;
    switch (action.type) {
        case 'set_rate':
            currentSettings = { ...state, rate: action.value };
            break;
        case 'set_pitch':
            currentSettings = { ...state, pitch: action.value };
            break;
        case 'set_settings':
            currentSettings = { ...action.value };
            break;
        default:
            return state;
    }

    currentSettingsItem.setValue(currentSettings);
    return { ...currentSettings };
};

function ReaderApp() {
    const theme = useTheme();
    const colorMode = useContext(ColorModeContext);

    const [voiceState, voiceDispatch] = useReducer(voiceReducer, {
        language: '',
        country: '',
        voice: null,
    });

    const [text, textDispatch] = useReducer(textReducer, '');

    const [alertState, alertDispatch] = useReducer(alertReducer, {
        open: false,
        alert: {}
    });

    const [settings, settingsDispatch] = useReducer(settingsReducer, {
        rate: 0,
        pitch: 0,
    });

    // Load data from server
    const [voicesLoading, voicesError, languages, countries, voices] = useFetch(voiceState);

    const { audioUrl, audioLoading, audioError, generateAudio } = useTTS();

    const handleChange = (value: string, type: string) => {
        if (!value) return;

        voiceDispatch({ type, value });
        alertDispatch({ type: 'close_alert' });
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        textDispatch({ type: 'set_text', value: e.target.value });
    };

    const handleSliderChange = (value: number, type: string) => {
        settingsDispatch({ type, value });
    };

    const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        alertDispatch({ type: 'close_alert' });
    };

    const handleSubmit = () => {
        alertDispatch({ type: 'generate_audio' });
        generateAudio(text, voiceState.voice.shortName, settings);
    };

    // The listener function captures the state at the time it was defined, and it doesn't get updated state values when they change.
    // To get the updated values, we use refs to store the state values and update them in the useEffect hook.
    const voiceStateRef = useRef(voiceState);
    const settingsRef = useRef(settings);

    useEffect(() => {
        voiceStateRef.current = voiceState;
        settingsRef.current = settings;
    }, [voiceState, settings]);

    useEffect(() => {
        const handleMessage = (message: any, sender: any, sendResponse: (response: any) => void) => {
            if (message === "PING_READER") {
                browser.tabs.getCurrent().then((tab) => {
                    if (tab && tab.id) {
                        sendResponse({ tabId: tab.id });
                    }
                });
                return true;
            }
        };
        browser.runtime.onMessage.addListener(handleMessage);
        return () => browser.runtime.onMessage.removeListener(handleMessage);
    }, []);

    useEffect(() => {
        // If side panel is open, clicking on context menu item will change text in storage => listen for changes => generate audio
        const unwatch = textItem.watch((newValue) => {
            if (!newValue) return;
            textDispatch({ type: 'set_text', value: newValue });
            textItem.removeValue();
            if (voiceStateRef.current && voiceStateRef.current.voice) {
                alertDispatch({ type: 'generate_audio' });
                generateAudio(newValue!, voiceStateRef.current.voice.shortName, settingsRef.current);
            }
            else {
                alertDispatch({ type: 'no_voice_selected' });
            }
        });

        (async () => {
            const currentVoice = await currentVoiceItem.getValue();
            const currentSettings = await currentSettingsItem.getValue();
            if (currentVoice) voiceDispatch({ type: 'set_voice', value: currentVoice });
            if (currentSettings) settingsDispatch({ type: 'set_settings', value: currentSettings });
            const storageText = await textItem.getValue();
            if (storageText) {
                textDispatch({ type: 'set_text', value: storageText });
                textItem.removeValue();
                if (currentVoice && currentVoice.voice) {
                    alertDispatch({ type: 'generate_audio' });
                    generateAudio(storageText, currentVoice.voice.shortName, currentSettings || settings);
                }
                else {
                    alertDispatch({ type: 'no_voice_selected' });
                }
            }
        })();
    }, []);

    useEffect(() => {
        if (audioUrl) {
            alertDispatch({ type: 'close_alert' });
        }
    }, [audioUrl]);

    useEffect(() => {
        if (voicesError) alertDispatch({ type: 'voices_error' });
        else if (audioError) alertDispatch({ type: 'audio_error' });
    }, [voicesError, audioError]);

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
                            MS Edge TTS Reader
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
                    <Grid container spacing={3}>
                        {/* Voice Selection and Settings - Collapsible */}
                        <Grid size={12}>
                            <Accordion 
                                defaultExpanded={false}
                                sx={{
                                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                    boxShadow: 'none',
                                    borderRadius: '8px !important',
                                    '&:before': {
                                        display: 'none',
                                    },
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    sx={{
                                        borderRadius: '8px',
                                        '& .MuiAccordionSummary-content': {
                                            my: 1.5,
                                        },
                                    }}
                                >
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Voice Configuration
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails sx={{ pt: 0, pb: 3 }}>
                                    <Grid container spacing={3}>
                                        {/* Voice Selection */}
                                        <Grid size={12}>
                                            <Typography variant="body2" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary' }}>
                                                Voice Selection
                                            </Typography>
                                            <Grid container spacing={2}>
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <SelectAutocomplete 
                                                        options={languages} 
                                                        label="Language" 
                                                        loading={voicesLoading} 
                                                        value={voiceState.language} 
                                                        onChange={(e: any, value: string) => handleChange(value, 'select_language')} 
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <SelectAutocomplete 
                                                        options={countries} 
                                                        label="Country" 
                                                        value={voiceState.country} 
                                                        onChange={(e: any, value: string) => handleChange(value, 'select_country')} 
                                                        isDisabled={!voiceState.language.length} 
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <SelectAutocomplete 
                                                        options={Object.keys(voices)} 
                                                        label="Voice" 
                                                        value={voiceState.voice && voiceState.voice.name} 
                                                        onChange={(e: any, value: string) => handleChange(voices[value], 'select_voice')} 
                                                        isDisabled={!voiceState.country.length} 
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Grid>

                                        {/* Voice Settings */}
                                        <Grid size={12}>
                                            <Typography variant="body2" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary' }}>
                                                Voice Settings
                                            </Typography>
                                            <Grid container spacing={3}>
                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <CustomSlider 
                                                        value={settings.rate} 
                                                        labels={['Slow', 'Default', 'Fast']} 
                                                        min={-50} 
                                                        max={50} 
                                                        defaultValue={0} 
                                                        label='Rate' 
                                                        onChange={(e: any, value: number) => handleSliderChange(value, 'set_rate')} 
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <CustomSlider 
                                                        value={settings.pitch} 
                                                        labels={['Low', 'Default', 'High']} 
                                                        min={-50} 
                                                        max={50} 
                                                        defaultValue={0} 
                                                        label='Pitch' 
                                                        onChange={(e: any, value: number) => handleSliderChange(value, 'set_pitch')} 
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>
                        </Grid>

                        {/* Text Input */}
                        <Grid size={12}>
                            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Text to Read
                            </Typography>
                            <TextField
                                value={text}
                                onChange={handleTextChange}
                                fullWidth
                                placeholder='Enter or select text to be spoken...'
                                multiline
                                minRows={6}
                                maxRows={15}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        fontSize: '1.1rem',
                                        lineHeight: 1.6,
                                    }
                                }}
                            />
                        </Grid>

                        {/* Generate Button */}
                        <Grid size={12}>
                            <Button
                                variant='contained'
                                size="large"
                                disabled={audioLoading || !voiceState.voice || !text.trim().length}
                                fullWidth
                                onClick={handleSubmit}
                                sx={{ 
                                    py: 1.5,
                                    borderRadius: 2,
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)',
                                    },
                                    '&.Mui-disabled': {
                                        background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                                    }
                                }}
                            >
                                Generate Audio
                            </Button>
                        </Grid>

                        {/* Audio Player */}
                        <Grid size={12}>
                            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Audio Player
                            </Typography>
                            <Box
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                }}
                            >
                                <audio src={audioUrl} autoPlay controls style={{ width: '100%' }}></audio>
                            </Box>
                        </Grid>

                        {/* Feedback Section */}
                        <Grid size={12}>
                            <Box sx={{ 
                                p: 3, 
                                borderRadius: 2,
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                            }}>
                                <Typography sx={{ mb: 1 }}>
                                    Satisfied ?
                                    <br />
                                    ⭐ Rate us on <Link
                                        href={import.meta.env.CHROME ? 'https://chrome.google.com/webstore/detail/oajalfneblkfiejoadecnmodfpnaeblh' : 'https://addons.mozilla.org/en-US/firefox/addon/ms-edge-tts-text-to-speech/'}
                                        target="_blank"
                                    >
                                        {import.meta.env.CHROME ? 'Chrome Web Store' : 'Mozilla Addons'}
                                    </Link>
                                    <br /><br />
                                    Not yet ?
                                    <br />
                                    ✨ Feature request / 🐞 Bug report :👉
                                    <IconButton
                                        size='small'
                                        href='https://github.com/yacine-bens/MsEdge-TTS-Extension/issues/new/choose'
                                        target='_blank'
                                    >
                                        <GitHub />
                                    </IconButton>
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            </Container>
            <SnackbarAlert open={alertState.open} alert={alertState.alert} onClose={handleClose} />
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
                    MuiAlert: {
                        styleOverrides: {
                            filledInfo: {
                                backgroundColor: mode === 'dark' ? '#304ffe' : '#667eea',
                                color: 'white'
                            },
                            filledWarning: {
                                color: 'white'
                            },
                        }
                    }
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
                <ReaderApp />
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
}

