const formElement = document.getElementById('userDetails');
const userNameElement = document.getElementById('userName');
const passwordElement = document.getElementById('password');
const regiserElement = document.getElementById('register');

regiserElement.addEventListener("click",()=>{
window.location.href = "/register";
})

formElement.addEventListener("submit",async (event)=>{
    event.preventDefault();
    userDetails = {userId: userNameElement.value,password: passwordElement.value};
    console.log(passwordElement.value);
    const res = await fetch('/verifyUserDetails',{method: "POST",
    body: JSON.stringify(userDetails),
    headers: {'Content-Type': 'application/json'}
});
    const data = await res.json();
    if(data.flag) window.location.href = `/chat/${userNameElement.value}`;
    else alert("Invalid Credentials");

});