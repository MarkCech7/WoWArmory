import human from "~/assets/armory-bg/human.png";
import human2 from "~/assets/armory-bg/humanupd.png";
import char from "~/assets/armory-bg/test4.png";
import type { ReactNode } from "react";

export default function ArmoryBackground(props: {
  raceId: number;
  children: ReactNode;
}) {
  let bg = "";
  switch (props.raceId) {
    case 1:
      bg = human2;
  }
  return (
    <div
      className="text-white w-[1300px] flex overflow-hidden p-2 justify-center h-[800px] bg-no-repeat relative bg-[length:118%] bg-[position:48%_75%]"
      style={{
        backgroundImage: `url(${bg})`,
      }}
    >
      <div className="pointer-events-none absolute inset-0 z-[5]">
        {/* LEFT fade (icons start here) #2a180d #1a0f08*/}
        <div
          className="absolute left-0 top-0 h-full w-[250px]"
          style={{
            background: "linear-gradient(to right, #2a180d, rgba(0,0,0,0.01))",
          }}
        />

        {/* RIGHT fade */}
        <div
          className="absolute right-0 top-0 h-full w-[250px]"
          style={{
            background: "linear-gradient(to left, #2a180d, rgba(0,0,0,0.01))",
          }}
        />

        {/* TOP fade */}
        <div
          className="absolute top-0 left-0 w-full h-[120px]"
          style={{
            background: "linear-gradient(to bottom, #2a180d, rgba(0,0,0,0.01))",
          }}
        />

        {/* BOTTOM fade */}
        <div
          className="absolute bottom-0 left-0 w-full h-[120px]"
          style={{
            background: "linear-gradient(to top, #2a180d, rgba(0,0,0,0.01))",
          }}
        />
      </div>

      <div className="absolute inset-0 backdrop-blur-[0.5px]"></div>
      <CharacterImage raceId={props.raceId} />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-35" />
      <div className="relative z-10 w-full h-full flex flex-col items-center">
        {props.children}
      </div>
    </div>
  );
}

export function CharacterImage(props: { raceId: number }) {
  let img = "";
  switch (props.raceId) {
    case 1:
      img = char;
  }
  return (
    //<div className="absolute bottom-[150px] left-[185px] pointer-events-none flex justify-center items-end">
    //<div className="absolute bottom-[-75px] left-[45px] pointer-events-none flex justify-center items-end">
    <div className="absolute bottom-[-75px] left-[95px] pointer-events-none flex justify-center items-end">
      <img
        src={img}
        alt="Character"
        //className="w-[700px] h-[550px] object-contain"
        className="w-[1200px] h-[950px] object-contain brightness-125"
      />
    </div>
  );
}
