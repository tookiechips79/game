import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Index from "./Index";

const BettingArenas = () => {
  const [activeArena, setActiveArena] = useState("9-ball");

  return (
    <div className="min-h-screen bg-black">
      {/* Arena Tabs */}
      <div className="sticky top-0 z-40 bg-black border-b" style={{ borderColor: '#95deff' }}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Tabs value={activeArena} onValueChange={setActiveArena} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-900">
              <TabsTrigger 
                value="9-ball"
                className="data-[state=active]:bg-[#95deff] data-[state=active]:text-black"
                style={{
                  color: activeArena === "9-ball" ? "#000" : "#95deff"
                }}
              >
                🎱 9 Ball Arena
              </TabsTrigger>
              <TabsTrigger 
                value="one-pocket"
                className="data-[state=active]:bg-[#95deff] data-[state=active]:text-black"
                style={{
                  color: activeArena === "one-pocket" ? "#000" : "#95deff"
                }}
              >
                🎯 One Pocket Arena
              </TabsTrigger>
              <TabsTrigger 
                value="8-ball"
                className="data-[state=active]:bg-[#95deff] data-[state=active]:text-black"
                style={{
                  color: activeArena === "8-ball" ? "#000" : "#95deff"
                }}
              >
                ⚫ 8 Ball Arena
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Arena Content */}
      <div className="w-full">
        {activeArena === "9-ball" && <Index arenaName="9 Ball" />}
        {activeArena === "one-pocket" && <Index arenaName="One Pocket" />}
        {activeArena === "8-ball" && <Index arenaName="8 Ball" />}
      </div>
    </div>
  );
};

export default BettingArenas;
