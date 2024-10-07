import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Snackbar from '@mui/material/Snackbar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';
import IconButton from '@mui/material/IconButton';

export default function History() {
  const { getAllActivity } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const [open, setOpen] = useState(false); // Controls Snackbar visibility
  const [errorMessage, setErrorMessage] = useState(''); // Store error message
  const routeTo = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getAllActivity();
        setMeetings(history);
      } catch (error) {
        setErrorMessage("Try Again Later");
        setOpen(true); // Trigger the Snackbar on error
      }
    };

    fetchHistory();
  }, []);

  // Close the Snackbar after displaying
  const handleClose = () => {
    setOpen(false);
  };

  //date
  let formatDate = (dateString) => {

    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear();

    return `${day}/${month}/${year}`
 }

  return (
    <div>
      <IconButton onClick={() => routeTo("/home")}>
        <HomeIcon />
      </IconButton>

      {
        meetings.length !== 0 ? (
          meetings.map((element, index) => (
            <Card key={index} variant="outlined">
              <CardContent>
                <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                  Code: {element.meetingCode}
                </Typography>
                <Typography sx={{ mb: 1.5 }} color="text.secondary">
                  Date: {formatDate(element.meetigDate)}
                </Typography>
              </CardContent>
            </Card>
          ))
        ) : (
          <div style={{ textAlign: 'center' }}>
            <h4><i>No Meetings Yet</i></h4>
          </div>
        )
      }

      {/* Snackbar for error handling */}
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        message={errorMessage}
      />
    </div>
  );
}
