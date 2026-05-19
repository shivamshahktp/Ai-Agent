import mongoose from "mongoose" //mongoose acts as a translator b/w code and database

const userSchema = new mongoose.Schema({
    email : {type : String, required : true , unique: true},
    password : {type: String, required: true},
    role : {type : String, default : "user", enum: ["user","moderator","admin"]},
    skills : [String],
    createdAt : {type : Date, default : Date.now}, //automatically stamps the date and time the user acc was created.
});

export default mongoose.model("User",userSchema); /*packages this blueprint so that other users can use it. 
(registered by nickname "User" so that i can refer with this name later)*/
