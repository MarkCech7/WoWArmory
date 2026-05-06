import { ArmoryFactionBackground } from "~/components/race";
import char from "~/assets/armory-bg/chartest2.png";
import chare from "~/assets/armory-bg/chare.png";
import type { ReactNode } from "react";

export default function ArmoryBackground(props: {
  raceId: number;
  children: ReactNode;
}) {
  let bg = ArmoryFactionBackground(props);
  return (
    <div
      className="text-white w-[1300px] flex overflow-hidden justify-center h-[790px] bg-no-repeat relative bg-[length:110%_120%] bg-[position:35%_90%]"
      style={{
        backgroundImage: `url(${bg})`,
      }}
    >
      <div className="pointer-events-none absolute inset-0 z-[5]">
        {/* LEFT fade (icons start here) #2a180d #1a0f08 #2a180d,*/}
        <div
          className="absolute left-0 top-0 h-full w-[250px]"
          style={{
            background: "linear-gradient(to right, #1f1105, rgba(0,0,0,0.01))",
          }}
        />

        {/* RIGHT fade */}
        <div
          className="absolute right-0 top-0 h-full w-[250px]"
          style={{
            background: "linear-gradient(to left, #1f1105, rgba(0,0,0,0.01))",
          }}
        />

        {/* TOP fade */}
        <div
          className="absolute top-0 left-0 w-full h-[270px]"
          style={{
            background: "linear-gradient(to bottom, #1f1105, rgba(0,0,0,0.01))",
          }}
        />

        {/* BOTTOM fade */}
        <div
          className="absolute bottom-0 left-0 w-full h-[120px]"
          style={{
            background: "linear-gradient(to top, #1f1105, rgba(0,0,0,0.01))",
          }}
        />
      </div>

      <div className="absolute inset-0 backdrop-blur-[0.5px]"></div>
      <CharacterImage raceId={props.raceId} />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-15" />
      <div className="relative z-10 w-full h-full flex flex-col items-center">
        {props.children}
      </div>
    </div>
  );
}

export function CharacterImage(props: { raceId: number }) {
  let img = char;
  switch (props.raceId) {
    case 1:
      img = char;
      break;
    case 10:
      img = chare;
      break;
  }
  return (
    //<div className="absolute bottom-[150px] left-[185px] pointer-events-none flex justify-center items-end">
    //<div className="absolute bottom-[-75px] left-[45px] pointer-events-none flex justify-center items-end">
    <div className="absolute bottom-[-86px] left-[82px] pointer-events-none flex justify-center items-end z-[9]">
      <img
        src={img}
        alt="Character"
        //className="w-[700px] h-[550px] object-contain"
        className="w-[1150px] h-[920px] object-contain brightness-125"
      />
    </div>
  );
}
