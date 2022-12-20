const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");

room.hidden = true;

let roomName;

function addMessage(message, isMe) {
  const div1 = room.querySelector("ul");
  div1.classList.add("wrap");

  const div2 = document.createElement("div");
  if (isMe) {
    div2.classList.add("ch2", "chat");
  } else {
    div2.classList.add("ch1", "chat");
  }
  div1.appendChild(div2);

  const div3 = document.createElement("div");
  div3.classList.add("textbox");
  div3.innerText = message;

  div2.appendChild(div3)
}

function handleMessageSubmit(event) {
  event.preventDefault();
  const input = room.querySelector("#message input");
  socket.emit("new_message", input.value, roomName, () => {
    addMessage(`You: ${input.value}`, true);
    input.value = "";
  });
}

function handleNicknameSubmit(event) {
  event.preventDefault();
  const input = room.querySelector("#name input");
  socket.emit("nickname", input.value);
}

function showRoom() {
  welcome.hidden = true;
  room.hidden = false;
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName}`;
  const messageForm = room.querySelector("#message");
  const nameForm = room.querySelector("#name");
  messageForm.addEventListener("submit", handleMessageSubmit);
  nameForm.addEventListener("submit", handleNicknameSubmit);
}

function handleRoomSubmit(event) {
  event.preventDefault();
  const roomInput = form.querySelector("#roomname");
  const nicknameInput = form.querySelector("#nickname");
  socket.emit("enter_room", roomInput.value, nicknameInput.value, showRoom);
  roomName = roomInput.value;
  roomInput.value = "";
}

form.addEventListener("submit", handleRoomSubmit);

socket.on("welcome", (user, newCount) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${newCount})`;
  addMessage(`${user} Joined!`);
});

socket.on("bye", (left, newCount) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${newCount})`;
  addMessage(`${left} Left!`);
});

socket.on("room_count", (newCount) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${newCount})`;
});

socket.on("new_message", addMessage);

socket.on("room_change", (rooms) => {
  const roomList = welcome.querySelector("ul");
  roomList.innerHTML = "";
  if(rooms.length === 0) {
    return;
  }
  rooms.forEach(room => {
    const li = document.createElement("li");
    li.innerText = room;
    roomList.append(li);
  });
});