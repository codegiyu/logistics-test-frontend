const regUserForm = document.querySelector("#register-user");
const regRiderForm = document.querySelector("#register-rider");
const loginForm = document.querySelector("#login");
const requestDeliveryForm = document.querySelector("#request-delivery");
const acceptDeliveryForm = document.querySelector("#accept-delivery");
const completeDeliveryForm = document.querySelector("#mark-delivery-complete");
const userIDField = document.querySelector("#user-id");
const roleField = document.querySelector("#role");
const tokenField = document.querySelector("#token");
const socketField = document.querySelector("#socket");

// Initialise socket;
let socket;

window.addEventListener("load", runOnLoad);
regUserForm.addEventListener("submit", registerUser);
regRiderForm.addEventListener("submit", registerRider);
loginForm.addEventListener("submit", login);
requestDeliveryForm.addEventListener("submit", requestDelivery);
acceptDeliveryForm.addEventListener("submit", acceptDelivery);
completeDeliveryForm.addEventListener("submit", markDeliveryComplete);


// Window onLoad function
function runOnLoad () {
    fillInUserDetails();
    manageWebsocketConn();
}

// Controllers for form submit functions
async function registerUser (e) {
    e.preventDefault();
    const form = e.target;
    const payload = getPayload(form);
    console.log(payload);

    const initialRes = await makeRequest("http://localhost:4000/v1/auth/register/customer", payload);
    console.log(initialRes); 
    const response = await initialRes.json();
    console.log(response);
}

async function registerRider (e) {
    e.preventDefault();
    const form = e.target;
    const payload = getPayload(form);
    console.log(payload);

    const initialRes = await makeRequest("http://localhost:4000/v1/auth/register/rider", payload);
    console.log(initialRes); 
    const response = await initialRes.json();
    console.log(response);
}

async function login (e) {
    e.preventDefault();
    const form = e.target;
    const payload = getPayload(form);
    console.log(payload);

    const initialRes = await makeRequest("http://localhost:4000/v1/auth/login", payload);
    console.log(initialRes); 
    const response = await initialRes.json();
    console.log(response);

    if (initialRes.ok) {
        console.log(response.data);

        if (response.data) {
            const { _id, role } = response.data.user;
            const token = response.token;

            localStorage.setItem("user_id", _id);
            localStorage.setItem("role", role);
            localStorage.setItem("token", token);

            fillInUserDetails();
            manageWebsocketConn();
        }
    }
}

async function requestDelivery (e) {
    e.preventDefault();
    const payload = getPayload(e.target);
    console.log(payload)

    payload.item_weight = Number(payload.item_weight);

    if (socket) {
        socket.emit("requestDelivery", payload, socketEmitCallback);
    } else {
        alert("No socket connection!");
    }
}

async function acceptDelivery (e) {
    e.preventDefault();
    const payload = getPayload(e.target);
    console.log(payload)

    if (socket) {
        socket.emit("acceptDelivery", payload, socketEmitCallback);
    } else {
        alert("No socket connection!");
    }
}

async function markDeliveryComplete (e) {
    e.preventDefault();
    const payload = getPayload(e.target);
    console.log(payload)

    if (socket) {
        socket.emit("markDeliveryComplete", payload, socketEmitCallback);
    } else {
        alert("No socket connection!");
    }
}


// Websocket manager function
async function manageWebsocketConn () {
    if (!localStorage.getItem("token")) {
        socketField.innerHTML = "-";
        localStorage.setItem("socket_id", "");
        console.log("User token not found. Terminating websocket connection process");
        return;
    }

    socket = io.connect("http://localhost:4000", {
        query: {
            token: localStorage.getItem("token")
        }
    });

    socket.on("connect", () => {
        localStorage.setItem("socket_id", socket.id);
        socketField.innerHTML = socket.id;
    })

    socket.on("notification", (message) => {
        console.log(message);
        alert(message);
    })

    socket.on("message", (message) => {
        console.log(message);
    })

    socket.on("serverMessage", (message) => {
        console.log(message);
        alert(message);
    })

    socket.on("joinRoom", (roomName) => {
        socket.emit("joinRoom", roomName)
    })

    socket.on("leaveRoom", (roomName) => {
        socket.emit("leaveRoom", roomName);
    })
}


// Utility functions
function getPayload(form) {
    const inputs = form.querySelectorAll("input");
    const payload = {};

    for (let input of inputs) {
        payload[input.name] = input.value
    }

    return payload;
}

async function makeRequest(url, payload, method = "post", token) {
    const options = {
        method,
        body: JSON.stringify(payload),
        headers: {}
    }

    if (token) {
        options["headers"]["Authorization"] = `Bearer ${token}`
    }

    if (payload) {
        options["headers"]["Content-Type"] = `application/json`
    }

    const response = await fetch(url, options);

    return response;
}

function socketEmitCallback(response) {
    console.log(response);
    alert(response.error || response.message);
}

function fillInUserDetails () {
    userIDField.innerHTML = localStorage.getItem("user_id") || "-";
    roleField.innerHTML = localStorage.getItem("role") || "-";
    tokenField.innerHTML = localStorage.getItem("token") || "-";
}