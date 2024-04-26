import { useState } from "react";


import { OpenAI } from "@langchain/openai";
import { loadSummarizationChain } from "langchain/chains";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import robotImage from "./assets/robot.png";


import pdfToText from "react-pdftotext";

import OpenAIClient from "openai";

function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (files: any) => {
    if (files && files.length > 0) {
      setPdfFile(files[0]);
    } else {
      setPdfFile(null);
    }
  };


  const handleSummarize = async (e: any) => {
    e.preventDefault();
    setAudioUrl("");
    setIsLoading(true);

  
    const client = new OpenAIClient({
      apiKey: `${import.meta.env.VITE_REACT_OPENAI_API_KEY}`,
      dangerouslyAllowBrowser: true,
    });

    if (pdfFile) {
      const pdfData = await pdfToText(pdfFile);
   
      const text = pdfData;
 
      const model = new OpenAI({
        temperature: 0,
        openAIApiKey: `${import.meta.env.VITE_REACT_OPENAI_API_KEY}`,
      });
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
      });
      const docs = await textSplitter.createDocuments([text]);

      const chain = loadSummarizationChain(model, { type: "map_reduce" });
      const res = await chain.call({
        input_documents: docs,
      });

      console.log(res.text);

      const response = await client.audio.speech.create({
        model: "tts-1",
        voice: "nova",
        input: res.text,
      });

      // console.log("response: ", response);

      if (!response.ok) {
        throw new Error("Failed to generate audio");
      setIsLoading(false);

      }


      const audioData = await response.blob();
      console.log("audioData: ", audioData);

      const audioUrl = URL.createObjectURL(audioData);
      console.log("audioUrl: ", audioUrl);

      setAudioUrl(audioUrl);
      setIsLoading(false);
    } else {
      console.log("No PDF file selected.");
      setIsLoading(false);
    }
  };

  return (
    <div className="card flex flex-row  min-h-screen w-full">
      <div className=" hidden md:block w-1/2">
        <img src={robotImage} alt="" className="  min-h-screen" />
      </div>

      <div className=" w-full gap-8 md:w-1/2 flex flex-col  justify-center items-center">
        <div className=" text-6xl text-[#111137] font-bold">Usher-AI</div>
        <p className=" italic font-light">
          Select a PDF file and get a summary with audio
        </p>

        <div>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => handleFileChange(e.target.files)}
          />
        </div>
        <button
          disabled={isLoading}
          onClick={handleSummarize}
          className=" disabled:bg-gray-400 bg-[#111137] cursor-pointer disabled:cursor-not-allowed text-white px-6 py-2 rounded-md"
        >
          Summarize
        </button>
        {audioUrl && (
          <audio controls>
            <source src={audioUrl} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        )}
      </div>
    </div>
  );
}

export default App;
