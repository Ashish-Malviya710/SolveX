import { io } from "socket.io-client";

// TODO: connect once authenticated, join the three channel types per project
const SOCKET_URL = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace("/api", "")
  : "http://localhost:8000";

const socket = io(SOCKET_URL, {
  autoConnect: false,
});

export default socket;
