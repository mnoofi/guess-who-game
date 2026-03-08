"use client"

import { ref, set, get, update, onValue } from "firebase/database"
import { db } from "@/lib/firebase"
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useState, useEffect } from "react"
import CharacterCard from "../components/CharacterCard"

export default function Home(){

const [user,setUser] = useState<any>(null)

const [removed,setRemoved] = useState<number[]>([])
const [opponentRemoved,setOpponentRemoved] = useState(0)

const [chosenCharacter,setChosenCharacter] = useState<number|null>(null)

const [roomCode,setRoomCode] = useState("")

const [playersReady,setPlayersReady] = useState(false)

const [characters,setCharacters] = useState<any[]>([])

const provider = new GoogleAuthProvider()

async function loginWithGoogle(){
const result = await signInWithPopup(auth,provider)
setUser(result.user)
}

useEffect(()=>{

const unsubscribe = onAuthStateChanged(auth,(u)=>{
setUser(u)
})

generateCharacters()

return ()=>unsubscribe()

},[])

function generateCharacters(){

const generated = Array.from({length:25}).map((_,i)=>{

const seed = Math.random().toString(36).substring(7)

return{
id:i,
avatar:`https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`
}

})

setCharacters(generated)

}

function createRoom(){

if(!user){
alert("Login first")
return
}

console.log("CREATE ROOM CLICKED")

const code = Math.random().toString(36).substring(2,7).toUpperCase()

console.log("ROOM CODE:",code)

setRoomCode(code)

set(ref(db,"rooms/"+code),{
players:{
[user.uid]:{
removed:0
}
}
})

alert("Room created: "+code)

listenRoom(code)

}

async function joinRoom(){

if(!user){
alert("Login first")
return
}

console.log("JOIN ROOM:",roomCode)

const roomRef = ref(db,"rooms/"+roomCode)

const snapshot = await get(roomRef)

if(!snapshot.exists()){
alert("Room not found")
return
}

update(ref(db,"rooms/"+roomCode+"/players/"+user.uid),{
removed:0
})

listenRoom(roomCode)

}

function listenRoom(code:string){

const roomRef = ref(db,"rooms/"+code)

onValue(roomRef,(snapshot)=>{

const data = snapshot.val()

if(!data) return

const players:any = data.players || {}

const ids = Object.keys(players)

if(ids.length === 2){
setPlayersReady(true)
}

const opponentId = ids.find(id=>id !== user?.uid)

if(opponentId){

const opponent = players[opponentId]

setOpponentRemoved(opponent?.removed || 0)

}

})

}

function toggleCard(id:number){

let newRemoved

if(removed.includes(id)){
newRemoved = removed.filter(x=>x!==id)
}else{
newRemoved = [...removed,id]
}

setRemoved(newRemoved)

update(ref(db,"rooms/"+roomCode+"/players/"+user.uid),{
removed:newRemoved.length
})

}

const remaining = 25 - removed.length

if(!user){

return(

<div className="p-10 flex justify-center">

<button
onClick={loginWithGoogle}
className="bg-black text-white px-6 py-3 rounded"

>

Sign in with Google

</button>

</div>

)

}

return(

<main className="p-10">

<div className="mb-6 flex items-center gap-4">

<img
src={user?.photoURL || ""}
className="w-10 h-10 rounded-full"
/>

<p className="font-semibold">
{user?.displayName}
</p>

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

<div className="mb-6 flex gap-2">

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

<div className="mb-4">

<p>Remaining Cards: {remaining}</p>

<p>Opponent Removed: {opponentRemoved}</p>

</div>

<div className="grid grid-cols-5 gap-4">

{characters.map((c)=>(

<div key={c.id} className="relative">

<button
onClick={()=>toggleCard(c.id)}
className="absolute top-1 left-1 bg-black text-white text-xs px-2 py-1 rounded z-10"

>

X

</button>

<CharacterCard
avatar={c.avatar}
removed={removed.includes(c.id)}
onClick={()=>{}}
/>

</div>

))}

</div>

</main>

)

}
