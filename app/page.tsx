"use client"

import { useEffect, useState } from "react"
import { auth, db } from "@/lib/firebase"

import {
signInWithPopup,
GoogleAuthProvider,
onAuthStateChanged,
signOut
} from "firebase/auth"

import {
ref,
set,
get,
update,
onValue
} from "firebase/database"



export default function Home(){

const [user,setUser] = useState<any>(null)

const [roomCode,setRoomCode] = useState("")

const [characters,setCharacters] = useState<any[]>([])

const [removed,setRemoved] = useState<number[]>([])

const [secret,setSecret] = useState<number|null>(null)

const [gameStarted,setGameStarted] = useState(false)

const [winner,setWinner] = useState("")

const [opponentRemaining,setOpponentRemaining] = useState(25)

const [leaderboard,setLeaderboard] = useState<any>({})

const [currentTurn,setCurrentTurn] = useState("")

const [timer,setTimer] = useState(30)

const provider = new GoogleAuthProvider()



useEffect(()=>{

const unsub = onAuthStateChanged(auth,(u)=>{
setUser(u)
})

return ()=>unsub()

},[])



useEffect(()=>{

if(!roomCode) return

const interval = setInterval(()=>{

setTimer((t)=>{

if(t <= 1){

switchTurn()

return 30

}

return t-1

})

},1000)

return ()=>clearInterval(interval)

},[roomCode])



function generateCharacters(){

return Array.from({length:25}).map((_,i)=>{

const seed = Math.random().toString(36).substring(7)

return{
id:i,
avatar:`https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`
}

})

}



async function createRoom(){

if(!user) return

const code = Math.random().toString(36).substring(2,7).toUpperCase()

const chars = generateCharacters()

setCharacters(chars)

setRoomCode(code)

await set(ref(db,"rooms/"+code),{

characters:chars,

turn:user.uid,

timer:30,

players:{
[user.uid]:{
character:null,
removed:[],
wrongGuesses:0,
score:0
}
},

winner:null

})

listenRoom(code)

alert("Room Code: "+code)

}



async function joinRoom(){

if(!user) return

const snapshot = await get(ref(db,"rooms/"+roomCode))

if(!snapshot.exists()){
alert("Room not found")
return
}

const data = snapshot.val()

setCharacters(data.characters)

await update(ref(db,"rooms/"+roomCode+"/players/"+user.uid),{
character:null,
removed:[],
wrongGuesses:0,
score:0
})

listenRoom(roomCode)

}



function listenRoom(code:string){

onValue(ref(db,"rooms/"+code),(snap)=>{

const data = snap.val()

if(!data) return

setCharacters(data.characters)

setWinner(data.winner || "")

setLeaderboard(data.players || {})

setCurrentTurn(data.turn || "")

setTimer(data.timer || 30)

const players = data.players || {}

const ids = Object.keys(players)

if(ids.length === 2){

const ready = ids.every(id => players[id].character !== null)

if(ready){
setGameStarted(true)
}

}

const opponent = ids.find(id => id !== user?.uid)

if(opponent){

const removedCount = players[opponent]?.removed?.length || 0

setOpponentRemaining(25 - removedCount)

}

})

}



async function chooseCharacter(id:number){

setSecret(id)

await update(ref(db,"rooms/"+roomCode+"/players/"+user.uid),{
character:id
})

}



async function toggleRemove(id:number){

let newRemoved

if(removed.includes(id)){
newRemoved = removed.filter(x=>x!==id)
}else{
newRemoved = [...removed,id]
}

setRemoved(newRemoved)

await update(ref(db,"rooms/"+roomCode+"/players/"+user.uid),{
removed:newRemoved
})

}



async function switchTurn(){

const snap = await get(ref(db,"rooms/"+roomCode+"/players"))

const players = snap.val()

const opponent = Object.keys(players).find(p=>p!==user.uid)

await update(ref(db,"rooms/"+roomCode),{
turn:opponent,
timer:30
})

}



async function guess(id:number){

if(currentTurn !== user.uid){
alert("Wait for your turn")
return
}

const snap = await get(ref(db,"rooms/"+roomCode+"/players"))

const players = snap.val()

const opponentId = Object.keys(players).find(p=>p!==user.uid)

const opponentCharacter = players[opponentId].character

const myScore = players[user.uid].score || 0

const myWrong = players[user.uid].wrongGuesses || 0

const remaining = 25 - removed.length

if(id === opponentCharacter){

let points = myScore

if(remaining >= 10){
points += 5
}

if(remaining <= 3){
points = points * 2
}

await update(ref(db,"rooms/"+roomCode+"/players/"+user.uid),{
score:points
})

await update(ref(db,"rooms/"+roomCode),{
winner:user.uid
})

}else{

const wrong = myWrong + 1

let newScore = myScore

if(wrong >= 2){
newScore -= 3
}

await update(ref(db,"rooms/"+roomCode+"/players/"+user.uid),{
wrongGuesses:wrong,
score:newScore
})

alert("Wrong Guess")

}

await switchTurn()

}



async function newRound(){

const chars = generateCharacters()

setRemoved([])
setSecret(null)
setWinner("")
setGameStarted(false)

await update(ref(db,"rooms/"+roomCode),{
characters:chars,
winner:null
})

}



async function login(){

const res = await signInWithPopup(auth,provider)

setUser(res.user)

}



if(!user){

return(

<div className="flex justify-center p-10">

<button
onClick={login}
className="bg-black text-white px-6 py-3 rounded"
>

Login with Google

</button>

</div>

)

}



return(

<main className="p-10">

<div className="flex gap-4 mb-6 items-center">

<img src={user.photoURL} className="w-10 h-10 rounded-full"/>

<p>{user.displayName}</p>

<button
onClick={()=>signOut(auth)}
className="bg-red-500 text-white px-3 py-1 rounded"
>

Logout

</button>

</div>



<h1 className="text-3xl font-bold mb-4">

Guess Who

</h1>



<p className="mb-2">
Current Turn: {currentTurn === user?.uid ? "You":"Opponent"}
</p>

<p className="mb-4 font-bold">
Timer: {timer}s
</p>



<div className="flex gap-2 mb-6">

<button
onClick={createRoom}
className="bg-blue-500 text-white px-4 py-2 rounded"
>

Create Room

</button>

<input
placeholder="Room Code"
value={roomCode}
onChange={(e)=>setRoomCode(e.target.value)}
className="border p-2"
/>

<button
onClick={joinRoom}
className="bg-green-500 text-white px-4 py-2 rounded"
>

Join Room

</button>

</div>



<p className="mb-4">
Opponent Remaining Cards: {opponentRemaining}
</p>



{secret === null && characters.length > 0 && (

<div>

<h2 className="mb-4 font-semibold">
Choose your secret character
</h2>

<div className="grid grid-cols-5 gap-4">

{characters.map(c=>(
<img
key={c.id}
src={c.avatar}
onClick={()=>chooseCharacter(c.id)}
className="cursor-pointer border rounded"
/>
))}

</div>

</div>

)}



{gameStarted && (

<div className="mt-8">

<h2 className="mb-4 font-semibold">
Guess Opponent Character
</h2>

<div className="grid grid-cols-5 gap-4">

{characters.map(c=>(

<div key={c.id} className="relative">

<button
onClick={()=>toggleRemove(c.id)}
className="absolute top-1 left-1 bg-black text-white text-xs px-2"
>
X
</button>

<img
src={c.avatar}
onClick={()=>guess(c.id)}
className={`cursor-pointer border rounded ${
removed.includes(c.id) ? "opacity-30":""
}`}
/>

</div>

))}

</div>

</div>

)}



{winner && (

<div className="mt-6">

<h2 className="text-xl font-bold">
Winner: {winner === user.uid ? "You 🎉":"Opponent"}
</h2>

<button
onClick={newRound}
className="mt-3 bg-purple-600 text-white px-4 py-2 rounded"
>
New Round
</button>

</div>

)}



<h2 className="mt-10 text-xl font-bold">
Leaderboard
</h2>

<ul className="mt-2">

{Object.entries(leaderboard).map(([id,data]:any)=>(
<li key={id}>
{id === user.uid ? "You":"Opponent"} : {data.score || 0} pts
</li>
))}

</ul>



</main>

)

}