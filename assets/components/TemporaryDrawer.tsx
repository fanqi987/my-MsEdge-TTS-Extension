import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import { IconButton, Link, Typography } from '@mui/material';
import { ArrowBackIosNew, GitHub } from '@mui/icons-material';

export default function TemporaryDrawer(props: any) {
    const { open, toggleDrawer } = props;

    const DrawerContent = (
        <Box>
            <IconButton
                size="large"
                edge="start"
                color="inherit"
                sx={{ m: 1 }}
                onClick={() => toggleDrawer(false)}
            >
                <ArrowBackIosNew />
            </IconButton>
            <Typography sx={{ position: 'fixed', top: '6%', left: '50%', transform: 'translate(-50%, -50%)' }} variant='h6'>About</Typography>
            <Box sx={{ mx: 2, mt: 8 }}>
                <Typography>
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
        </Box>
    );

    return (
        <div>
            <Drawer
                open={open}
                onClose={() => toggleDrawer(false)}
                slotProps={{
                    paper: {
                        sx: { width: '100%' }
                    }
                }}
            >
                {DrawerContent}
            </Drawer>
        </div>
    );
}
