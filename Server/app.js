require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const path = require("path");
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const { createServer } = require("http");
const { Server } = require("socket.io");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro"});
const db = require("./data/database");


const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {});
const scriptPath = path.join(__dirname,"../Client/Scripts");

const userSockets = {};
const revUserSockets = {};

//middleware
app.use(express.urlencoded({extended: false}));
app.use(express.static(scriptPath));
app.use(express.json());
app.use(cookieParser());


//functions
function authenticate(req,res,next){
    const token = req.cookies.token;
    try{
        const user = jwt.verify(token,process.env.SECRET_KEY);
        req.userId = user;
        next();
    }
    catch{
        res.clearCookie("token");
        return res.redirect("/");
    }
}

async function isUserExist(userId){
    const result = await db.getDb().collection('Users').findOne({userId: userId});
    if(result) return true;
    return false;
}

async function getAiResponse(userName) {
    const prompt = `Imagine in a chat application the user named ${userName} has set is status to busy; so how would you tell this to other user regarding this?`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }
/*
Structure of a message
{
    from: string,
    to: string,
    messageNo: int,
    message: string,
    isAi: bool;
}

*/

//socket connections
io.on("connection", (socket) => {
    socket.on("saveUser", (user) => {
      userSockets[`${socket.id}`] = user; 
    revUserSockets[user] = socket.id;
    });

    socket.on("getStatus",async ()=>{
        const userId = userSockets[`${socket.id}`];
        const userStatus = await db.getDb().collection('Status').findOne({userId: userId});
        socket.emit("setStatus",userStatus.status);
    })

    socket.on("setStatus",async (status)=>{
        await db.getDb().collection('Status').updateOne({userId: userSockets[`${socket.id}`]}, { $set: {status: status} });
    });

    socket.on("sendMessage",async (arg)=>{
        const from = userSockets[`${socket.id}`];
        const to = arg.to;
        const message = arg.message;
        const targetUserStatus = await db.getDb().collection('Status').findOne({userId: to});
        const res1 = await db.getDb().collection('Chat-sequence-number').findOne({user1: from ,user2: to});
        const res2 = await db.getDb().collection('Chat-sequence-number').findOne({user1: to ,user2: from});
        let seqNo;
        if(res1){
            seqNo = res1.seqNo+1;
            await db.getDb().collection('Chat-sequence-number').updateOne({user1: from ,user2: to},{ $set: {seqNo: seqNo} });
        }
        else if(res2){
            seqNo = res2.seqNo+1;
            db.getDb().collection('Chat-sequence-number').updateOne({user1: to ,user2: from},{ $set: {seqNo: seqNo} });
        }
        else{
            seqNo = 1;
            db.getDb().collection('Chat-sequence-number').insertOne({user1: from ,user2: to,seqNo: 1});
        }
        
        const completeMessage = {from: from,to: to,messageNo: seqNo,message: message,isAi: false};
        await db.getDb().collection('Chats').insertOne(completeMessage); 
        socket.emit("message",completeMessage);

        if(targetUserStatus.status === "BUSY"){
            seqNo++;
            const AiMessage = await getAiResponse(to);
            completeAiMessage = {from: to,to: from,messageNo: seqNo,message: AiMessage,isAi: true };
            await db.getDb().collection('Chats').insertOne(completeAiMessage); 
            socket.emit("message",completeAiMessage);
        }
        else if(revUserSockets[`${to}`]) socket.to(revUserSockets[`${to}`]).emit("message",completeMessage);
        
        
    });

    socket.on("disconnect",()=>{
        delete revUserSockets[`${userSockets[`${socket.id}`]}`];
        delete userSockets[`${socket.id}`];
    })
});


//ajax requests
app.post('/getStatus',authenticate,async (req,res)=>{
    console.log("AJAX GET /getStatus");
    const userId = req.userId;
    const statusData = await db.getDb().collection('Status').findOne({userId: userId});
    res.json({status: statusData.status});
    
});

app.post('/getChats',authenticate,async (req,res)=>{
console.log("AJAX GET /getchats");
const userId = req.userId;
const targetUser = req.body.targetUser;
const fromData = await db.getDb().collection('Chats').find({from: userId,to: targetUser}).toArray();
const toData = await db.getDb().collection('Chats').find({from:targetUser, to: userId}).toArray();
const chats = [];
for(const chat of fromData)   chats.push(chat);
for(const chat of toData )    chats.push(chat);
res.json(chats);

});



app.get('/getUserIds',authenticate,async (req,res)=>{
    console.log("AJAX GET /getUserIds");
const userId = req.userId;
const fromData = await db.getDb().collection('Chats').find({from: userId,messageNo: 1}).toArray();
const toData = await db.getDb().collection('Chats').find({to: userId,messageNo: 1}).toArray();
const users = {userIds:[]};
for(const chat of fromData)    users.userIds.push(chat.to);
for(const chat of toData )     users.userIds.push(chat.from);
res.json(users);

});

app.post('/isUserExist',async (req,res) => {
    console.log("AJAX POST /isUserExist");
const userId = req.body.userId;
const isExist = await isUserExist(userId);
res.json({isExist: isExist});
});

app.post('/saveUserDetails',async (req,res) =>{
    console.log('GET /saveUserDetails');
    const data = req.body;
    const password = data.password;
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword =  bcrypt.hashSync(password,salt);
    data.password = hashedPassword;
    const userStatus = {userId: data.userId, status: "AVAILABLE"};
    res.json();
    await db.getDb().collection('Users').insertOne(data);
    await db.getDb().collection('Status').insertOne(userStatus);
});

app.post('/verifyUserDetails',async (req,res) => {
    console.log("POST /verfifyUserDetails");
const userId = req.body.userId;
const password = req.body.password;
const user = await db.getDb().collection('Users').findOne({userId: userId});
let flag = false;
if(user){
const isValidPassword = bcrypt.compareSync(password,user.password);
if(isValidPassword ) flag=true;
const token  = jwt.sign(userId,process.env.SECRET_KEY);
res.cookie("token",token,{httpOnly:true});
}
res.json({flag:flag});
});


//get and post methods
app.get('/', (req,res) =>  {
    console.log("GET /");
res.status(200).sendFile(path.join(__dirname,"../Client/Views/login.html"));
});

app.get('/register', (req,res) =>  {
    console.log("GET /register");
res.status(200).sendFile(path.join(__dirname,"../Client/Views/register.html"));
});

app.get('/chat/:username',authenticate,(req,res) => {
console.log("GET /chat/username");
res.status(200).sendFile(path.join(__dirname,"../Client/views/chats.html"));
});

app.get('/chat/:userName/:targetUser',authenticate,async (req,res) =>{
    console.log("GET /chat/user/targetUser");
const targetUserId = req.params.targetUser;
const isExist = await isUserExist(targetUserId);
if(isExist) res.status(200).sendFile(path.join(__dirname,"../Client/views/coversation.html"));
else res.redirect(`/chat/${req.params.userName}`);

});

app.post('/', (req,res) =>  {
    console.log("POST /")
    console.log("/ => post");
res.status(200).sendFile(path.join(__dirname,"../Client/Views/login.html"));
});

db.connectToDatabase().then(()=>{
    httpServer.listen(process.env.PORT,()=>{console.log("Process Running on Port "+process.env.PORT)});
})

