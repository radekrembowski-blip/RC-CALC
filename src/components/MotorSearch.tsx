import React, { useState } from "react";
import { GoogleGenAI, Type } from "@google/genai";
import { Search, Loader2, Plus, X } from "lucide-react";
import { Motor } from "../types";

interface MotorSearchProps {
  onAddMotor: (motor: Motor) => void;
  onClose: () => void;
}

export default function MotorSearch({ onAddMotor, onClose }: MotorSearchProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Find technical specifications for the RC motor: "${query}". 
        Return the data in JSON format with the following fields: 
        brand, model, kv, weight (grams), internalResistance (ohms), noLoadCurrent (amps), noLoadVoltage (volts), maxCurrent (amps), maxPower (watts).
        If you don't know the exact specs, provide reasonable estimates based on the motor size/class.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              brand: { type: Type.STRING },
              model: { type: Type.STRING },
              kv: { type: Type.NUMBER },
              weight: { type: Type.NUMBER },
              internalResistance: { type: Type.NUMBER },
              noLoadCurrent: { type: Type.NUMBER },
              noLoadVoltage: { type: Type.NUMBER },
              maxCurrent: { type: Type.NUMBER },
              maxPower: { type: Type.NUMBER },
            },
            required: ["brand", "model", "kv", "weight", "internalResistance", "noLoadCurrent", "noLoadVoltage", "maxCurrent", "maxPower"]
          }
        }
      });

      const data = JSON.parse(response.text);
      const newMotor: Motor = {
        id: `ai-${Date.now()}`,
        ...data
      };
      onAddMotor(newMotor);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Could not find motor specs. Please try a different name or enter manually.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-black/5 flex items-center justify-between">
          <h3 className="text-lg font-bold">AI Motor Search</h3>
          <button onClick={onClose} className="p-2 hover:bg-[#F5F5F4] rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-sm text-[#6B6B6B]">
            Type the name of any RC motor (e.g. "T-Motor AT2312") and our AI will find its technical specifications for you.
          </p>
          
          <div className="relative">
            <input 
              type="text"
              placeholder="Search motor model..."
              className="w-full bg-[#F5F5F4] border-none rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-black/5"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6B6B]" size={18} />
          </div>

          {error && (
            <div className="p-3 bg-rose-50 text-rose-600 text-xs rounded-lg border border-rose-100">
              {error}
            </div>
          )}

          <button 
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="w-full bg-black text-white rounded-xl py-3 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Searching...
              </>
            ) : (
              <>
                <Search size={18} />
                Find Specs
              </>
            )}
          </button>
        </div>
        
        <div className="bg-[#F5F5F4] p-4 text-[10px] text-[#6B6B6B] text-center">
          Powered by Gemini AI • Estimates may vary from manufacturer data
        </div>
      </div>
    </div>
  );
}
