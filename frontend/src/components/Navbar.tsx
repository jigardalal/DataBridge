import { AppBar, Toolbar, Typography, Button } from "@mui/material";

export const Navbar = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>DataBridge</Typography>
        <Button color="inherit">Upload</Button>
        <Button color="inherit">Datasets</Button>
      </Toolbar>
    </AppBar>
  );
};
