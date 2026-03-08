"use client"

type Props = {
avatar:string
removed:boolean
onClick:()=>void
}

export default function CharacterCard({avatar,removed,onClick}:Props){

return(

<div
onClick={onClick}
className={`relative rounded-xl border p-2 transition
${removed ? "opacity-20":"hover:scale-105"}
`}
>

<img src={avatar} className="w-full h-24 object-contain"/>

</div>

)

}