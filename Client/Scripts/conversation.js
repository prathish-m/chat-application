const socket = io();
const sendBtn = document.getElementById("send-msg");
const msgInput = document.getElementById("msg");
const chatElement = document.getElementById('chats');
const logoutButton = document.getElementById("logout");
const backBtn = document.getElementById("back");
const statusDrpDwn = document.getElementById("status");
const pathname = window.location.pathname;
const pathArr = pathname.split('/');
const userId = pathArr[2];
const targetUser = pathArr[3]; 
let innerHTML = "";


async function getChats(){
const res = await fetch("/getChats",{method:"POST",credentials: "include", body: JSON.stringify({targetUser: targetUser}),headers: {'Content-Type': 'application/json'}});
return res.json();
}

async function getStatus(){
    const res = await fetch("/getStatus",{method:"POST",credentials: "include", body: JSON.stringify({userId: userId}),headers: {'Content-Type': 'application/json'}});
    return res.json();
}


async function run(){
const chats = await getChats();
const statusData = await getStatus();
chats.sort((a,b)=>{
    if (a.messageNo < b.messageNo) return -1;
  if (a.messageNo > b.messageNo) return 1;
  return 0;
})

for(const msg of chats){
    innerHTML+='<li>';
    if(msg.from === userId) innerHTML+='You';
    else innerHTML+=msg.from;
    if(msg.isAi) innerHTML+='(AI)';
    innerHTML+=": "+msg.message+'</li>';
}
chatElement.innerHTML = innerHTML;
if(statusData.status === "BUSY") statusDrpDwn.selectedIndex = 1; 
}

socket.on('connect',()=>{
    socket.emit("saveUser", userId );
    socket.emit("getStatus");
});

socket.on("setStatus",(status)=>{
if(status === "BUSY") statusDrpDwn.selectedIndex = 1;
else  statusDrpDwn.selectedIndex = 0;
});

    


sendBtn.addEventListener('click',(event)=>{
    event.preventDefault();
    const msg = msgInput.value;
    msgInput.value = "";
    socket.emit('sendMessage',{message: msg,to: targetUser});
});

socket.on('message',(msg)=>{
    innerHTML+='<li>';
    if(msg.from === userId) innerHTML+='You';
    else innerHTML+=msg.from;
    if(msg.isAi) innerHTML+='(AI)';
    innerHTML+=": "+msg.message+'</li>';
    chatElement.innerHTML = innerHTML;
});

backBtn.addEventListener('click',(event)=>{
    event.preventDefault();
    window.location.href=`/chat/${userId}`;
});

statusDrpDwn.addEventListener('change',(event)=>{
    socket.emit("setStatus",event.target.value);
    if(event.target.value === "AVAILABLE") window.location.reload();
});

logoutButton.addEventListener("click",async (event)=>{
    event.preventDefault();
    socket.disconnect();
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href="/";
});

run();