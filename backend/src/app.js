import express from "express"; //express
import mongoose from 'mongoose'; //mongoose
import { createServer } from "http"; //socketio
import cors from "cors"; //cors
import { connectToServer } from "./controllers/socketManagement.js"; //socket management

const app = express ();
//signaling
const server = createServer(app); // app instance is created
const io = connectToServer(server); // to connect socketio to the same server as app

app.set("port", (process.env.PORT || 8000));
app.use(express.json({ limit: "40kb" })); //limit to decrese payload
app.use(express.urlencoded({ limit: "40kb", extended: true }));
app.use(cors());

import userRoutes from "./routes/user.js";
app.use("/api/v1/users", userRoutes); //using all imported user routes 

const start = async () => {
    try{
        const connectionDb = await mongoose.connect('mongodb+srv://Apsarunnisa:hPUTQ4zka7hEXRP8@cluster0.ix4dd.mongodb.net/');
        console.log(`MONGO Connected DB HOst: ${connectionDb.connection.host}`);
    }catch(e){
        console.log(`atlas error ${e}`);
    }

    server.listen(app.get("port"), () => {
        console.log("LISTENING ON PORT 8000");
    });
}
start();