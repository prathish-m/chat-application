
const logoutButton = document.getElementById("logout");
const chatDiv = document.getElementById("add-chats");
const chatBtn = document.getElementById('chat-btn');
const targetUserElement = document.getElementById('targetUserId'); 


let htmlCode = "<label>Chat with:</label><br>";

async function getUserIds(){
    const res = await fetch("/getUserIds",{method:"GET",credentials: "include",headers: {'Content-Type': 'application/json'}});
    return res.json();
}



async function run(){

const data = await getUserIds();
const userIds = data.userIds;
let i=1;
for(userId of userIds)    htmlCode+=`${i++})<a href="${window.location.pathname}/${userId}">${userId}</a>`;
chatDiv.innerHTML = htmlCode;
}

async function getUserIds(){
const res = await fetch("/getUserIds",{method:"GET",credentials: "include",headers: {'Content-Type': 'application/json'}});
return res.json();
}


chatBtn.addEventListener("click",async (event)=>{
event.preventDefault();
if(targetUserElement.value){
    const res =await fetch('/isUserExist',{
        method:'POST',
    body: JSON.stringify({userId: targetUserElement.value}),
    headers: {'Content-Type': 'application/json'}});
    const data = await res.json();
    if(data.isExist)   window.location.href=window.location.pathname+'/'+targetUserElement.value;
    else alert("User Does not exist");
    }
    else alert("Cannot be null");

});

logoutButton.addEventListener("click",async (event)=>{
    event.preventDefault();
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href="/";
});

run();