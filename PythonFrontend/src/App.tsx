import React, { useState, useRef, useEffect } from "react";
import { Mic, Volume2, VolumeX, Pause } from "lucide-react";
import myFont from './assets/dinround/DINRoundPro-Bold.eot';
import { Button } from "./components/components/ui/button";
import toast, { Toaster } from "react-hot-toast";

interface LetterAnalysis {
  status: "correct" | "missing";
  letters: Record<string, "correct" | "miss">;
}

interface ApiResponse {
  correct_sentence: string;
  correct_phonetics: string;
  user_phonetics: string;
  letter_analysis: Record<string, LetterAnalysis>;
  word_accuracy: number;
  user_audio: string;
  reference_audio: string;
  user_mfcc: string; // Base64 MFCC Image
  reference_mfcc: string; // Base64 MFCC Image
}<div className="absolute bottom-[-5rem] right-[10px]  opacity-50 ">
<img src="/greenpaint.png" alt="" />
</div>

const easySentences = [
  "She sells sea shells by the sea shore",
  "Betty bought a bit of butter, but the butter was bitter",
  "Fred fed Ted bread, and Ted fed Fred bread",
  "A proper copper coffee pot keeps coffee piping hot.",
  "Red lorry, yellow lorry, little lovely lorry",
  "Six slippery snails slid slowly seaward",
  "How can a clam cram in a clean cream can",
  "Crisp crusts crackle and crunch crazily",
  "Shut up the shutters and sit in the shop",
  "Truly rural, truly rural, truly rural",
  "I saw a kitten eating chicken in the kitchen",
  "Lesser leather never weathered wetter weather better",
  "Red leather, yellow leather, red leather, yellow leather",
  "Four furious friends fought for the phone",
  "Can you can a can as a canner can can a can",
  "Cooks cook cupcakes quickly",
  
  "If a dog chews shoes, whose shoes does he choose",
  "The soldiers shouldered shooters on their shoulders"


];

const getRandomSentence = () => {
  return easySentences[Math.floor(Math.random() * easySentences.length)];
};

const PronunciationChecker: React.FC = () => {
  const [referenceText, setReferenceText] = useState<string>("");
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    if(!referenceText){
      toast.error("It needs a sentence")
      return
    }
    try {
      setResponse(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setIsRecording(true);
      
      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result?.toString().split(",")[1];
          if (base64Audio) sendAudioToServer(base64Audio);
        };
      };

      mediaRecorder.start();

      
    } catch (error) {
      setResponse(null);
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioToServer = async (audioBase64: string) => {
    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_audio: audioBase64, sentence: referenceText }),
      });
      const data: ApiResponse = await response.json();
      setResponse(data);
    } catch (error) {
      console.error("Error sending audio to server:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = (base64Audio: string) => {
    const audio = new Audio(base64Audio);
    audio.play();
  };

  const renderHighlightedText = () => {
    if (!response) return null;
    
    return response.correct_sentence.split(" ").map((word, index) => {
      const wordData = response.letter_analysis[word.toLowerCase()];
      
      return (
        <span key={index} className="mx-1 underline decoration-[#508297]">
          {word.split("").map((char, charIndex) => {
            const letterStatus = wordData?.letters[char.toLowerCase()];
            const color = letterStatus === "correct" ? "text-green-600" : "text-[#d84848]";
            return (
              <span key={charIndex} className={`${color}`}>
          {char}
              </span>
            );
          })} {" "}
        </span>
      );
    });
  };

  const playAudioFeedback = (path: string) => {
    const audio = new Audio(path);
    audio.play();
  };

  const calculateAccuracy = (): string => {
    if (!response) return "0";
  
    const totalWords = Object.keys(response.letter_analysis).length;
    let correctWords = 0;
  
    Object.values(response.letter_analysis).forEach((wordData) => {
      const allCorrect = Object.values(wordData.letters).every(status => status === "correct");
      if (allCorrect) correctWords++;
    });
  
    return ((correctWords / totalWords) * 100).toFixed(1);
  };
  

  useEffect(() => {
    if (response) {
      const accuracy = parseFloat(calculateAccuracy());
      if (accuracy >= 80) {
        playAudioFeedback("/audio/win.wav"); // Play success sound
      } else if (accuracy >= 50) {
        playAudioFeedback("/audio/medium.wav"); // Play medium sound
      } else {
        playAudioFeedback("/audio/fail.wav"); // Play fail sound
      }
    }
  }, [response]);
  

  return (
    <div className="flex relative w-full px-[20rem] bg-[#131f24] justify-center  h-[130vh]">
      <div className="absolute top-[-10rem] left-[-10rem]  opacity-30 ">
        <img src="/greenpaint.png" alt="" />
      </div>
      {/* <div className="absolute bottom-[-5rem] right-[10px]  opacity-50 ">
        <img src="/greenpaint.png" alt="" />
      </div> */}
      <div className="p-6 w-full min-h-[50rem] px-10 mx-auto ">
        <h1 className="text-[32px] font-extrabold mb-10 text-white text-center" style={{fontFamily:myFont}} >Pronunciation Checker</h1>
        <div className="flex flex-col">
          <label className="text-green-400 font-bold text-md mb-2" style={{fontFamily:myFont}}>* Enter a sentence to check pronunciation</label>
          <div className="flex gap-2">
          <input
          required
            type="text"
            placeholder="Enter reference sentence..."
            value={referenceText}
            onChange={(e) => {setReferenceText(e.target.value)}}
            className="border-[#37464f] border-2 outline-none p-2 w-full text-[#e3f4ff] font-semibold  mb-4 rounded bg-transparent"
            style={{fontFamily:myFont}}
          />
            <Button onClick={() => setReferenceText(getRandomSentence())} size="lg" variant="secondary" className="w-[15rem] cursor-pointer" asChild> 
                <span >Random Sentence</span>
              </Button>
            </div>
          {/* <div className="mb-3 text-white font-bold text-xl text-center" style={{fontFamily:myFont}}>or</div> */}
          <div className="w-full flex justify-center mb-4">
          {/* <button
            
            className="mb-4 bg-gray-500 text-white px-4 py-2 rounded"
          >
            Get Random Sentence
          </button> */}
          
          </div>
          <div className="flex justify-center items-center gap-2 flex-col mt-5">
          <label className="text-[#ce1eff] font-bold text-md mb-2" style={{fontFamily:myFont}}>(Start recording to check pronunciation)</label>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-3 text-white rounded-full ${isRecording ? "bg-red-500" : "bg-[#ce1eff]"}`}
          >
            {isRecording ? <Pause size={24} /> : <Mic size={24} />}
          </button>
          
          </div>
        </div>
        
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-[#e3f4ff] p-6 rounded-lg shadow-lg text-center animate-pulse">
              <p className="text-lg font-semibold" style={{fontFamily:myFont}}>Analyzing pronunciation...</p>
            </div>
          </div>
        )}
        {response && (
          <div className="mt-12">
            <div className="flex items-center justify-center gap-2">
              <p className="text-xl text-center font-semibold" style={{fontFamily:myFont}}>{renderHighlightedText()}</p>
              <button onClick={() => playAudio(response.reference_audio)} className="bg-[#ce1eff] text-[#e3f4ff] p-1 rounded-full">
                <Volume2 size={24} />
              </button>
            </div>
            <p className="text-[#8bb2ca] text-center italic">{response.correct_phonetics}</p>
            
            <div className="flex items-center justify-center gap-2 mt-2">
              <p className="text-blue-500 ">{response.user_phonetics}</p>
              <button onClick={() => playAudio(response.user_audio)} className="bg-blue-500 text-[#e3f4ff] p-1 rounded-full">
                <Volume2 size={24} />
              </button>
            </div>
            
            <p className="mt-2 text-lg text-[#e3f4ff] font-bold" style={{fontFamily:myFont}}>Accuracy: {calculateAccuracy()}%</p>
          </div>
        )}
        {response && (
          <div className="mt-12">
            <h2 className="text-xl text-center font-bold text-[#e3f4ff]" style={{fontFamily:myFont}}>MFCC Comparison</h2>
            <div className="flex justify-center gap-8 mt-2">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-[#e3f4ff]" style={{fontFamily:myFont}}>Reference Audio</h3>
                <img src={`data:image/png;base64,${response.reference_mfcc}`} alt="Reference MFCC" className="border shadow-md" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-[#e3f4ff]" style={{fontFamily:myFont}}>User Audio</h3>
                <img src={`data:image/png;base64,${response.user_mfcc}`} alt="User MFCC" className="border shadow-md" />
              </div>
            </div>
          </div>
        )}

      </div>
      <Toaster/>
    </div>
  );
};

export default PronunciationChecker;
