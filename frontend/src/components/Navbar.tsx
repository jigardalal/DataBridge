import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import { Link } from "react-router-dom";

export const Navbar = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>PortPro Data Bridge</Typography>
        <Button color="inherit" component={Link} to="/upload">Upload</Button>
        <Button color="inherit" component={Link} to="/datasets">Datasets</Button>
        <Button color="inherit" component={Link} to="/mappings">Mappings</Button>
      </Toolbar>
    </AppBar>
  );
};
