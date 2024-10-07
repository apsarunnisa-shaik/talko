import express from "express"; //express
import { config } from "dotenv";
if(process.env.NODE_ENV !== "Production"){
    config();
}

import mongoose from 'mongoose'; //mongoose
import { createServer } from "http"; //socketio
import cors from "cors"; //cors
import { connectToServer } from "./controllers/socketManagement.js"; //socket management

const app = express ();
//server integration
const server = createServer(app); // creates http server using app instance 
const io = connectToServer(server); // to connect socketio to the same http server

const port = process.env.PORT || 8000;
app.set("port", port);
app.use(express.json({ limit: "40kb" })); //limit to decrease payload
app.use(express.urlencoded({ limit: "40kb", extended: true }));
app.use(cors());

import userRoutes from "./routes/user.js";
app.use("/api/v1/users", userRoutes); //middleware allows to use all user routes 

const start = async () => {
    try{
        const connectionDb = await mongoose.connect(process.env.ATLAS_URL);
        console.log(`MONGO Connected DB HOst: ${connectionDb.connection.host}`);
    }catch(e){
        console.log(`atlas error ${e}`);
    }

    // app(express instance) handles req-res and server handles req-listening process
    server.listen(app.get("port"), () => {
        console.log(`LISTENING ON PORT ${port}`);
    });
}
start();