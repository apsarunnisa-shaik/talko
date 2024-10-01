import { Server, Socket } from "socket.io";

let connections = {}; // for number of connections;
let messages = {}; 
let onlineTime = {};

export const connectToServer = (server) =>{ //server is socket.io server
    const io = new Server(server, {
        cors:{
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    }); // initializing socketio instance to the http server with cors

    io.on('connection', (socket) => {  // listens for websocket connections from client. socket is socket.io server

        //lobby created(signalling events)
        socket.on("join-call", (path)=>{ //listens on "join-call" event by client, path is loby link emitted by the client

            if(connections[path] === undefined){
                connections[path] = [];
            }
            connections[path].push(socket.id); //clients socket.id
            onlineTime[socket.id] = new Date(); //log in time

            //All users in the path are notified that a new user has joined via the "user-joined" event.
            connections[path].forEach(eachDevicePath => {
                io.to(eachDevicePath).emit("user-joined", socket.id, connections[path]);
            });

            if(messages[path] !== undefined){
                for(let i=0; i< messages[path].length; i++){
                    io.to("chat-msg").emit(messages[path][i]['data'], messages[path][i]['sender'], messages[path][i]['socket-id-sender']);
                }
            }

        });


        //After joining, if the client needs to establish a direct connection with another peer
        socket.on("signal", (toId, message)=>{
            io.to(toId).emit("signal", socket.id, message);
        });


        //event listeners for "chat messages"
        socket.on("chat-msg", (sender, data)=>{
            //finding the meeting room and isUser in the meeting room

            // returns obj to array of arrays [[key, value], []...] i.e connections = {"path": [socket1, socket2]} => [ ["path", [socket1, socket2] ] ]
            const [meetingRoom, foundUser] = Object.entries(connections) 
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
            for([room, pathIds] of JSON.parse(JSON.stringify(Object.entries(connections)))){ // to create a deep clone structure:[["path", ["socket1", "socket2"]]]
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