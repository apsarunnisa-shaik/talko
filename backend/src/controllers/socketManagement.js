// import { connection } from "mongoose";
import { Server, Socket } from "socket.io";

let connections = {}; // for number of connections;
let messages = {}; 
let onlineTime = {};

export const connectToServer = (server) =>{
    const io = new Server(server, {
        cors:{
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    }); // initializing socketio instance to the http server

    io.on('connection', (socket) => {  // listens for websocket connections from client

        //lobby created
        socket.on("join-call", (path)=>{ //listens on "join-call" event by client, path is loby link emitted by the client

            if(connections[path] === undefined){
                connections[path] = [];
            }
            connections[path].push(socket.id); //user id
            onlineTime[socket.id] = new Date(); //log in time

            // for(let i=0; i<connections[path].length; i++){
            //     io.to(connections[path][i].emmit("user-joined", socket.id, connections[path]));
            // }
            connections[path].forEach(eachDevicePath => {
                io.to(eachDevicePath).emit("user-joined", socket.id, connections[path]);
            });

            if(messages[path] !== undefined){
                for(let i=0; i< messages[path].length; i++){
                    io.to("chat-msg").emit(messages[path][i]['data'], messages[path][i]['sender'], messages[path][i]['socket-id-sender']);
                }
            }

        });


        //signalling mechanism (exchange of socket.id)
        socket.on("signal", (toId, message)=>{
            socket.to(toId).emit("signal", socket.id, message);
        });


        //event listeners for "chat messages"
        socket.on("chat-msg", (sender, data)=>{
            //finding the meeting room and isUser in the meeting room
            const [meetingRoom, foundUser] = Object.entries(connections) // returns obj to array of arrays [[key, value], []...]
                .reduce(([room, found], [path, pathIds]) =>{
                    if(!found, pathIds.includes(socket.id)){
                        return [path, true]
                    }
                    return [room, found]
                }, ['', false]); 

            // to store messages 
            if(messages[meetingRoom] === undefined){
                messages[meetingRoom] = [];
            }
            messages[meetingRoom].push({
                "sender": sender,
                "data": data,
                "socket-id-sender": socket-id-sender
            });
            console.log(`the socket id is: ${socket-id-sender}, ${sender}: ${data}`);

            //Broadcasting the messages to all the users
            connections[meetingRoom].forEach((eachMsg) =>{
                io.to(eachMsg).emit("chat-msg", sender, data, socket.id);
            });

        });

        //event triggers when client disconnect from server
        socket.on("disconnect", ()=>{
            let key;
            //finding the users room
            for([room, pathIds] of JSON.parse(JSON.stringify(Object.entries(connections)))){ // to create a deep clone 
                for(let i=0; i<pathIds.length; ++i){
                    if(pathIds === socket.id){
                        key = room;

                        //emitting a user-left event to the remaining users
                        for(let i=0; i<connections[room].length; ++i){
                            io.to("connections[room][i]").emit("user-left", socket.id);
                        }

                        //removing the user from room
                        var index = connections[room].indexOf(socket.id);
                        connections[room].splice(index, 1);

                        //delete the room if empty
                        if(connections[room].length ===0){
                            delete connections[room];
                        }
                    }
                }
            }

        });
    })
}