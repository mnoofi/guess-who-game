import { io } from "socket.io-client"

export const socket = io("https://guess-who-client-two.vercel.app", {
  transports: ["websocket"]
})