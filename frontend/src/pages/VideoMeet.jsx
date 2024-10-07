import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import { Badge, IconButton, TextField } from '@mui/material';
import { Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import styles from "../css/videoMeet.module.css";
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import { useNavigate } from 'react-router-dom'
import server from "../env.js"

// import server from '../environment';

const server_url = `${server}`;

var connections = {};

//configuring a stun server to get public ip address and port
const peerConfigConnections = {
    iceServers:  [{"urls": 'stun:stun.l.google.com:19302'}]
}


export default function VideoMeet() {
var socketRef = useRef(); //socket from client
let socketIdRef = useRef(); //local user id

//localVideoref is a reference to the local video element in the DOM, it means that localVideoref allows you to directly access and manipulate the <video> HTML element in the Document Object Model (DOM) without needing to use traditional document selectors like document.getElementById().
let localVideoref = useRef();

//video, audio acessable via hardware (browser permission)
let [videoAvailable, setVideoAvailable] = useState(true);
let [audioAvailable, setAudioAvailable] = useState(true);
//display camera capture
let [screenAvailable, setScreenAvailable] = useState();

//video, audio
let [video, setVideo] = useState([]);
let [audio, setAudio] = useState();

let [screen, setScreen] = useState();

//popup
let [showModal, setModal] = useState(true);

//all the messages
let [messages, setMessages] = useState([])

//single message typed in textArea
let [message, setMessage] = useState("");

//adding the new message for badge
let [newMessages, setNewMessages] = useState(0);

//guest login
let [askForUsername, setAskForUsername] = useState(true);

let [username, setUsername] = useState("");

const videoRef = useRef([]);

let [videos, setVideos] = useState([]);

let routeTo = useNavigate();

// TODO
// if(isChrome() === false) {


// }

//as soon as this page opens
useEffect(() => {
    console.log("Requesting media permissions inside useEffect");
    getPermissions();

}, []);

//connect btn event
let connect = () => {
    setAskForUsername(false);
    getMedia();
}


useEffect(() => {
    if (video !== undefined && audio !== undefined) {
        getUserMedia();
        console.log("SET STATE HAS ", video, audio);
    }
},[audio, video])
let getMedia = () => {
    setVideo(videoAvailable);//async fun
    setAudio(audioAvailable);//async fun
    // getUserMedia(); not async fun so useEffect with dependencies is used
    connectToSocketServer();
}


//creating offer for media connection establishment
const getUserMediaSuccess = (stream) => {

    //managing callers media stream
    try {
        window.localStream.getTracks().forEach(track => track.stop())
    } catch(e){
        console.log(e);
    }
    window.localStream = stream; //resetting the localStream
    localVideoref.current.srcObject = stream; //resetting the stream on dom

    // initiating handshake
    for (let id in connections) {
        if (id === socketIdRef.current){
            continue;
        }
        connections[id].addStream(window.localStream)

        connections[id].createOffer().then((description) => {
            console.log(description)
            connections[id].setLocalDescription(description)
                .then(() => {
                    socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                })
                .catch(e => console.log(e))
        })
    }

    //if stream gets disconnected || ended
    stream.getTracks().forEach(track => track.onended = () => {
        setVideo(false);
        setAudio(false);

        try {
            let tracks = localVideoref.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        } catch (e) { 
            console.log(e);
        }
        
        //blacksilence ortherwise createOffer
        let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
        window.localStream = blackSilence();
        localVideoref.current.srcObject = window.localStream;

        for (let id in connections) {
            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }
    })
}


//to check and manage the user media tracks
let getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
        navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
            .then(getUserMediaSuccess)
            .then((stream) => { })
            .catch((e) => console.log(e))
    } else {
        try {
            let tracks = localVideoref.current.srcObject.getTracks(); // what is avaliable either audio || video || none
            tracks.forEach(track => track.stop()); //to stop all the tracks
        } catch (e) {
            console.log(e);
        }
    }
}


//socket functions
const connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, { secure: false }) //socket connection to the server(backend)

    socketRef.current.on('signal', gotMessageFromServer);

    socketRef.current.on('connect', () => {
        socketRef.current.emit('join-call', window.location.href);

        socketIdRef.current = socketRef.current.id;

        socketRef.current.on('chat-msg', addMessage);

        socketRef.current.on('user-left', (id) => {
            setVideos((videos) => videos.filter((video) => video.socketId !== id)) //add all the videos except matched id
        })

        socketRef.current.on('user-joined', (id, clients) => { ////clients => all devicePaths
            clients.forEach((socketListId) => {
                
                // p2p connection
                connections[socketListId] = new RTCPeerConnection(peerConfigConnections)

                // Wait for their ice candidate (gathers the ice candidate and (signalling) defines the optimal path to communicate)    
                connections[socketListId].onicecandidate = function (event) {
                    if (event.candidate != null) {
                        socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                    }
                }

                // Wait for their video stream
                connections[socketListId].onaddstream = (event) => {
                    console.log("BEFORE:", videoRef.current);
                    console.log("FINDING ID: ", socketListId);

                    let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                    if (videoExists) {
                        console.log("FOUND EXISTING");

                        // Update the stream of the existing video
                        setVideos(videos => {
                            const updatedVideos = videos.map(video =>
                                video.socketId === socketListId ? { ...video, stream: event.stream } : video
                            );
                            videoRef.current = updatedVideos;
                            return updatedVideos; // Return the updated array of videos to update state
                        });
                    } else {
                        // Create a new video
                        console.log("CREATING NEW");
                        let newVideo = {
                            socketId: socketListId,
                            stream: event.stream,
                            autoplay: true, //automatically plays the media stream(audio || video || both) if available
                            playsinline: true //This ensures that the video will play inline in the webpage, without going into fullscreen mode on mobile browsers.
                        };
                        setVideos(videos => {
                            const updatedVideos = [...videos, newVideo];
                            videoRef.current = updatedVideos;
                            return updatedVideos;
                        });
                    }
                };

                // Add local media stream (i.e., the user's own video and/or audio stream) if available otherwise blacksilence
                if (window.localStream !== undefined && window.localStream !== null) {
                    connections[socketListId].addStream(window.localStream)
                } else {
                    let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                    window.localStream = blackSilence()
                    connections[socketListId].addStream(window.localStream)
                }
            })

            //handshake, createOffer() method of the RTCPeerConnection interface initiates the creation of an SDP offer for the purpose of starting a new WebRTC connection to a remote peer.
            if (id === socketIdRef.current) { //client id same as local user
                for (let id2 in connections) {
                    if (id2 === socketIdRef.current){
                        continue //No need to creatOffer for caller
                    }
                    try {
                        connections[id2].addStream(window.localStream)
                    } catch (e) { }

                    connections[id2].createOffer().then((description) => {
                        connections[id2].setLocalDescription(description) //creates the offer and sends it to the remote system over a signaling channel.
                            .then(() => {
                                socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }));
                            })
                            .catch(e => console.log(e));
                    })
                }
            }
        })
    })
}

// createOffer's answer 
let gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message)

    if (fromId !== socketIdRef.current) { //all clients except caller
        if (signal.sdp) {
            connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                if (signal.sdp.type === 'offer') {
                    connections[fromId].createAnswer().then((description) => {
                        connections[fromId].setLocalDescription(description).then(() => {
                            socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
                        }).catch(e => console.log(e))
                    }).catch(e => console.log(e))
                }
            }).catch(e => console.log(e))
        }
        
        //connecting ice candidate which says how to route packets between peers
        if (signal.ice) {
            connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
        }
    }
}

const getPermissions = async()=>{
    try{
        //videoPermission
        let videoPermission = await navigator.mediaDevices.getUserMedia({video: true}); 
        if(videoPermission){
            setVideoAvailable(true);
            console.log("video permission granted");
        }else{
            setVideoAvailable(false);
            console.log("Video permisssion denied");
        }

        //audioPermission
        let audioPermission = await navigator.mediaDevices.getUserMedia({audio: true}); 
        if(audioPermission){
            setAudioAvailable(true);
            console.log("audio permission granted");
        }else{
            setAudioAvailable(false);
            console.log("audio permisssion denied");
        }

        //camera capture(live)
        if(navigator.mediaDevices.getDisplayMedia){
            setScreenAvailable(true);
        }else{
            setScreenAvailable(false);
        }

        //assigning live media stream to a video element to play on the webpage
        if(videoAvailable || audioAvailable){
            const userMediaStream = await navigator.mediaDevices.getUserMedia({video: videoAvailable, audio: audioAvailable});
            if(userMediaStream){
                window.localStream = userMediaStream; //Storing the Media Stream Globally

                //Assigning the Media Stream to a Video Element (dom)
                if(localVideoref.current){
                    localVideoref.current.srcObject = userMediaStream;
                }
            }
        }
    }catch(err){
        console.log(err);
        throw err;
    }
}


//functions for silent audio track and black video
let silence = () => {
    let context = new AudioContext();
    let oscillator = context.createOscillator();
    let dst = oscillator.connect(context.createMediaStreamDestination());
    oscillator.start();
    context.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
}
let black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), { width, height })
    canvas.getContext('2d').fillRect(0, 0, width, height);
    let stream = canvas.captureStream()
    return Object.assign(stream.getVideoTracks()[0], { enabled: false })
}

const getDislayMediaSuccess = (stream) => {
    console.log("screen sharing");
    //stop all streams
    try {
        window.localStream.getTracks().forEach(track => track.stop())
    } catch (e) { console.log(e) }

    //add stream to local and localVideoref
    window.localStream = stream;
    localVideoref.current.srcObject = stream;

    //creatOffer
    for (let id in connections) {
        if (id === socketIdRef.current) continue

        connections[id].addStream(window.localStream)

        connections[id].createOffer().then((description) => {
            connections[id].setLocalDescription(description)
                .then(() => {
                    socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                })
                .catch(e => console.log(e))
        })
    }

    //if stream gets disconnected || ended
    stream.getTracks().forEach(track => track.onended = () => {
        setScreen(false)

        try {
            let tracks = localVideoref.current.srcObject.getTracks()
            tracks.forEach(track => track.stop())
        } catch (e) { console.log(e) }

        //blacksilence ortherwise createOffer
        let blackSilence = (...args) => new MediaStream([black(...args), silence()])
        window.localStream = blackSilence()
        localVideoref.current.srcObject = window.localStream

        getUserMedia()

    })
}

//screen sharing        
let getDislayMedia = () => {
    if (screen) {
        if (navigator.mediaDevices.getDisplayMedia) {
            navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                .then(getDislayMediaSuccess)
                .then((stream) => { })
                .catch((e) => console.log(e))
        }
    }
}

useEffect(() => {
    if (screen !== undefined) {
        getDislayMedia();
    }
}, [screen]);
let handleScreen = () => {
    setScreen(!screen);
}

//adding messages to the state Variables
let addMessage = (data, sender, socketIdSender) => {
    console.log(data,sender);

    setMessages((prevMessages) =>
        [...prevMessages, {sender: sender, data: data}]
    );

    if(socketIdSender !== socketIdRef.current){
        setNewMessages((prevMessages) => prevMessages +1);
    }
}

let sendMessage = () => {
    socketRef.current.emit("chat-msg", username, message); //emit the message to handle
    setMessage(" "); //clear the message
}


//disconnect handler
let handleEndCall = () => {
    try {
        if(localVideoref.current){  
            setVideo(false);
            setAudio(false);
        }
        let tracks = localVideoref.current.srcObject.getTracks();
        console.log("call ended with id", socketIdRef);
        tracks.forEach(track => track.stop());
    } catch (e) { console.log(e); }
    routeTo("/home");
}


return (
    // <div>VideoMeet {window.location.href} </div>
    <div>
        {/* if askForUsername then joiner else initiator */}
        {askForUsername === true? 
            <div>
                <h2>Enter into Lobby </h2>
                <div style={{display: "flex", margin: "10px", gap: "10px", padding: "10px"}}>
                    <TextField id="outlined-basic" label="Username" value={username} onChange={e => setUsername(e.target.value)} variant="outlined" />
                    <Button variant="contained" onClick={connect}>Connect</Button>
                </div>
                <div >
                    <video ref={localVideoref} autoPlay muted></video>
                </div>
            </div> :
                <div className= {styles.meetVideoContainer}>

                    {/* chat box */}
                    {showModal ? <div className={styles.chatRoom}>
                        <div className={styles.chatContainer}>
                            <h1>Chat</h1>

                            {/* messages display */}
                            <div className={styles.chattingDisplay}>
                                {messages.length !== 0 ? messages.map((item, index) => {
                                    return (
                                        <div style={{ marginBottom: "20px" }} key={index}>
                                            <p style={{ fontWeight: "bold"}}>{item.sender}</p>
                                            <p>{item.data}</p>
                                        </div>
                                    )
                                }) : <p>start the chat</p>}
                            </div>

                            <div className={styles.chattingArea}>
                                <TextField value={message} onChange={(e) => setMessage(e.target.value)} id="outlined-basic" label="Enter Your chat" variant="outlined" />
                                <Button variant='contained' onClick={sendMessage}>Send</Button>
                            </div>
                        </div>
                    </div> : <></>}

                    {/* Icons */}
                    <div className={styles.buttonContainers}>
                        <IconButton onClick={() => setVideo(!video)} style={{ color: "white", zIndex: 100 }}>
                            {(video === true) ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>

                        <IconButton  onClick={handleEndCall} style={{ color: "red", zIndex: 100 }}>
                            <CallEndIcon  />
                        </IconButton>

                        <IconButton onClick={() => setAudio(!audio)} style={{ color: "white", zIndex: 100 }}>
                            {audio === true ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>

                        {screenAvailable === true ?
                            <IconButton onClick={handleScreen} style={{ color: "white", zIndex: 100 }}>
                                {screen === true ? <ScreenShareIcon /> : <StopScreenShareIcon />}
                            </IconButton> : <></>}

                        <Badge badgeContent={newMessages} max={999} color='orange'>
                            <IconButton onClick={() => setModal(!showModal)} style={{ color: "white", zIndex: 100 }}>
                                <ChatIcon /> 
                            </IconButton>
                        </Badge>

                    </div>
                    
                    {/* localuser media after connecting */}
                    <video className ={styles.meetUserVideo} ref={localVideoref} autoPlay muted></video>
                    
                    <div className={styles.conferenceView}>
                        {/* other joiners */}
                        {videos.map((video) => (
                            <div key={video.socketId}>
                                <video ref = { (ref) => {
                                    if(ref && video.stream){
                                        ref.srcObject = video.stream;
                                    }
                                }} autoPlay> </video>
                            </div>
                        ))}
                    </div>
                </div>
        }
    </div>
)
}
