import { Avatar as VisageAvatar } from "@readyplayerme/visage";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Lipsync } from "wawa-lipsync";
import { useFrame, useGraph, useThree } from "@react-three/fiber";

const modelSrc = "https://models.readyplayer.me/65805362d72a7a816405eca3.glb";

// New component to handle lipsync logic
const LipsyncController = ({ lipsync }: { lipsync: Lipsync | null }) => {
  const { scene } = useThree();
  const { nodes } = useGraph(scene);
  const head = nodes.Wolf3D_Head || nodes.Wolf3D_Avatar;

  useFrame(() => {
    if (lipsync && head && lipsync.viseme) {
      // Map viseme data to morph targets of the head object
      // This part needs to be implemented based on the specific morph target names
      // and the viseme data structure from wawa-lipsync.
      // Example (this is a placeholder and needs actual implementation):
      // if (head.morphTargetDictionary && head.morphTargetInfluences) {
      //   const visemeMap = {
      //     "viseme_PP": "mouthPucker", // Example mapping
      //     "viseme_aa": "mouthOpen",
      //     // ... other visemes
      //   };
      //   for (const visemeKey in lipsync.viseme) {
      //     const morphTargetName = visemeMap[visemeKey];
      //     if (morphTargetName && head.morphTargetDictionary[morphTargetName] !== undefined) {
      //       head.morphTargetInfluences[head.morphTargetDictionary[morphTargetName]] = lipsync.viseme[visemeKey];
      //     }
      //   }
      // }
    }
  });
  return null;
};

export const Avatar = forwardRef((props, ref) => {
  const [lipsync, setLipsync] = useState<Lipsync | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Initialize Lipsync without arguments
    const newLipsync = new Lipsync();
    setLipsync(newLipsync);
  }, []);

  const speak = async (text: string) => {
    const audio = audioRef.current;

    if (audio) {
      const response = await fetch(
        "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": process.env.REACT_APP_ELEVENLABS_API_KEY || "",
          },
          body: JSON.stringify({
            text,
            voice_settings: {
              stability: 0,
              similarity_boost: 0,
            },
          }),
        }
      );

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      audio.src = audioUrl;
      audio.play();

      if (lipsync) {
        lipsync.connectAudio(audio);
      }

      audio.onended = () => {
        // No explicit stop method, the lipsync will stop when audio ends
      };
    }
  };

  useImperativeHandle(ref, () => ({
    speak,
  }));

  return (
    <div className="h-full w-full bg-transparent">
      <VisageAvatar modelSrc={modelSrc} onLoaded={() => { /* onLoaded is called with no args */ }} >
        {lipsync && <LipsyncController lipsync={lipsync} />}
      </VisageAvatar>
      <audio ref={audioRef} hidden />
    </div>
  );
});