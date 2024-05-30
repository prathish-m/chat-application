const inputElement = document.getElementById('user-id');
const formElement = document.getElementById('register');
const divElement = document.getElementById('warning-space');
const firstName = document.getElementById('first-name');
const lastName =document.getElementById('last-name');
const password = document.getElementById('password');
const confirmPassword = document.getElementById('confirm-password');

async function isUserExist(userId){
    const res =await fetch('/isUserExist',{
        method:'POST',
    body: JSON.stringify({userId: userId}),
    headers: {'Content-Type': 'application/json'}});
    const data = await res.json();
    return data;
    
}

inputElement.addEventListener('input',async ()=>{
    if(inputElement.value){
    const res = await isUserExist(inputElement.value);
    if(res.isExist)    divElement.textContent = "User Already Exists!";
    else divElement.textContent = "User Id Available";
    }
    else divElement.textContent="Cannot be null";

});

formElement.addEventListener('submit',async (event)=>{
event.preventDefault();
const user = await isUserExist(inputElement.value);
if(user.isExist) {
    alert("User Already Exist");
    return ;
}
if(!password.value.length) {
    alert('Password cannot be null');
    return ;
}
if(!firstName.value.length) {
    alert('First Name cannot be null');
    return ;
}

if(password.value !== confirmPassword.value){
    alert('Password and Confirm Password are not equal!');
    return ;
}
await fetch('/saveUserDetails',
{method:'POST',
    body: JSON.stringify({
        firstName: firstName.value,
        lastName: lastName.value,
        password: password.value,
        userId: inputElement.value
    }),
    headers: {'Content-Type': 'application/json'}
})
window.location.href = "/";
})