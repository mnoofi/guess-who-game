const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const cors = require("cors")

const app = express()
app.use(cors())

const server = http.createServer(app)

const io = new Server(server,{
  cors:{origin:"*"}
})

let rooms = {}
let scores = {}

function generateRoomCode(){
  return Math.random().toString(36).substring(2,7).toUpperCase()
}

io.on("connection",(socket)=>{

  socket.on("create_room",()=>{

    const code = generateRoomCode()

    rooms[code] = {
      players:[socket.id],
      characters:{},
      guesses:{},
      removedCount:{},
      playAgain:[]
    }

    socket.join(code)

    socket.emit("room_created",code)

  })

  socket.on("join_room",(code)=>{

    if(!rooms[code]) return

    rooms[code].players.push(socket.id)

    socket.join(code)

    io.to(code).emit("room_ready")

  })

  socket.on("choose_character",(id)=>{

    const room = Object.keys(rooms).find(r =>
      rooms[r].players.includes(socket.id)
    )

    if(!room) return

    rooms[room].characters[socket.id] = id

  })

  socket.on("remove_card",(count)=>{

    const room = Object.keys(rooms).find(r =>
      rooms[r].players.includes(socket.id)
    )

    if(!room) return

    rooms[room].removedCount[socket.id] = count

    const opponent = rooms[room].players.find(p=>p!==socket.id)

    io.to(opponent).emit("opponent_removed",count)

  })

  socket.on("guess_character",(guess)=>{

    const room = Object.keys(rooms).find(r =>
      rooms[r].players.includes(socket.id)
    )

    if(!room) return

    const opponent = rooms[room].players.find(p=>p!==socket.id)

    const opponentCharacter = rooms[room].characters[opponent]

    if(!rooms[room].guesses[socket.id]){
      rooms[room].guesses[socket.id]=0
    }

    if(guess === opponentCharacter){

      io.to(room).emit("game_over",{
        winner:socket.id,
        characters:rooms[room].characters
      })

      return
    }

    rooms[room].guesses[socket.id]++

    if(rooms[room].guesses[socket.id] >= 2){

      io.to(room).emit("game_over",{
        winner:opponent,
        characters:rooms[room].characters
      })

    }

  })

  socket.on("play_again",()=>{

    const room = Object.keys(rooms).find(r =>
      rooms[r].players.includes(socket.id)
    )

    if(!room) return

    rooms[room].playAgain.push(socket.id)

    if(rooms[room].playAgain.length === 2){

      rooms[room].guesses={}
      rooms[room].characters={}
      rooms[room].playAgain=[]
      rooms[room].removedCount={}

      io.to(room).emit("restart_game")

    }

  })

})

server.listen(5000,()=>{
  console.log("server running on port 5000")
})