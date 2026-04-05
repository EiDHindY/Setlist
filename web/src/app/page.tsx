"use client";

import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";

export default function Home() {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [status, setStatus] = useState("Disconnected");
  const [logs, setLogs] = useState<string[]>([]);
  const clashId = "test-room-1";

  // Helper to append logs to the UI
  const addLog = (message: string) => {
    setLogs((prev) => [...prev, message]);
  };

  useEffect(() => {
    // 1. Build the connection payload pointing exactly at the C# server
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5138";
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${backendUrl}/hub/clash`)
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);
    
    // Cleanup connection when the component unmounts
    return () => {
        newConnection.stop();
    };
  }, []);

  const connectToKitchen = async () => {
    if (connection) {
        try {
            setStatus("Connecting...");
            await connection.start();
            setStatus("Connected 🟢");
            addLog("Successfully dialed the C# Kitchen.");

            // 2. We hook up our React UI to LISTEN for events broadcasted by C#
            connection.on("UserJoined", (connectionId: string) => {
                addLog(`Someone joined! Connection ID: ${connectionId}`);
            });

            connection.on("VoteReceived", (songId: string) => {
                addLog(`🔥 Vote Broadcast Received: ${songId}`);
            });

            // 3. We tell C# we want to join this specific clash room
            await connection.invoke("JoinClash", clashId);
            addLog(`Joined Clash Room: ${clashId}`);

        } catch (error) {
            console.error("Connection failed: ", error);
            setStatus("Connection Failed 🔴");
        }
    }
  };

  const castTestVote = async () => {
    if (connection && status === "Connected 🟢") {
        const randomSong = Math.random() > 0.5 ? "Metallica - Master of Puppets" : "Megadeth - Holy Wars";
        // Call the C# method exactly as named in ClashHub.cs
        await connection.invoke("SendTestVote", clashId, randomSong);
        addLog(`>> You sent a vote for ${randomSong}`);
    } else {
        addLog("Cannot vote. You are not connected.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-8 font-sans">
      <div className="max-w-2xl w-full bg-slate-800 rounded-xl shadow-xl p-8 border border-slate-700">
        
        <h1 className="text-3xl font-bold mb-2 text-emerald-400">Setlist Live Connection</h1>
        <p className="text-slate-400 mb-8 border-b border-slate-700 pb-4">
          Status: <span className={`font-semibold ${status.includes("Connected") ? "text-emerald-400" : "text-rose-400"}`}>{status}</span>
        </p>

        <div className="flex gap-4 mb-8">
          <button 
            onClick={connectToKitchen}
            disabled={status.includes("Connected")}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-all shadow-lg active:scale-95"
          >
            1. Connect to C# Kitchen
          </button>
          
          <button 
            onClick={castTestVote}
            className="px-6 py-3 bg-rose-600 hover:bg-rose-500 rounded-lg font-semibold transition-all shadow-lg active:scale-95"
          >
            2. Cast Random Vote 🎸
          </button>
        </div>

        <div className="bg-slate-950 rounded-lg p-4 font-mono text-sm h-64 overflow-y-auto border border-slate-800 shadow-inner">
          <div className="text-slate-500 mb-2">// Live Server Logs</div>
          {logs.length === 0 ? (
            <div className="text-slate-600 animate-pulse">Waiting for connection...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-2 text-emerald-300">
                <span className="text-slate-600 mr-2">[{new Date().toLocaleTimeString()}]</span>
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
