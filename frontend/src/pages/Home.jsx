import React, { useContext, useState } from 'react';
import withAuth from '../utils/withAuth.jsx';
import "../css/Home.css";
import { useNavigate } from 'react-router-dom'
import { Button, IconButton, TextField } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import { AuthContext } from '../contexts/AuthContext';

function HomeComponent() {
    let navigate = useNavigate();

    const [meetingCode, setMeetingCode] = useState("");

    const {addActivity} = useContext(AuthContext);

    let handleJoinVideoCall = async () => {
        console.log("in add activity handler");
        await addActivity(meetingCode);
        navigate(`/${meetingCode}`);
    }

    return (
        <>
            <div className="navBar">
                <div style={{ display: "flex", alignItems: "center" }}>
                    <h2>Talko Video Call</h2>
                </div>

                <div style={{ display: "flex", alignItems: "center" }}>
                    <IconButton onClick={
                        () => {
                            navigate("/add_activity");
                        }
                    }>
                        <RestoreIcon />
                    </IconButton>

                    <p onClick={() => {
                        navigate("/get_all_activity");
                    }}
                    >History</p>

                    <Button onClick={() => {
                        localStorage.removeItem("token")
                        navigate("/auth")
                    }}>
                        Logout
                    </Button>
                </div>


            </div>


            <div className="meetContainer">
                <div className="leftPanel">
                    <div>
                        <h2>Providing Quality Video Call To Connect TO Your Loved Once In No Time</h2>

                        <div style={{ display: 'flex', gap: "10px" }}>

                            <TextField onChange={e => setMeetingCode(e.target.value)} id="outlined-basic" label="Meeting Code" variant="outlined" />
                            <Button onClick={handleJoinVideoCall} variant='contained'>Join</Button>

                        </div>
                    </div>
                </div>
                <div className='rightPanel'>
                    <img srcSet='/vedioMeet_logo.png' alt="" />
                </div>
            </div>

        </>
    )
}


export default withAuth(HomeComponent);