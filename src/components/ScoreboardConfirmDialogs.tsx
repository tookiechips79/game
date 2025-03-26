
import React from "react";
import ConfirmDialog from "@/components/ConfirmDialog";

interface ScoreboardConfirmDialogsProps {
  teamAWinConfirmOpen: boolean;
  teamBWinConfirmOpen: boolean;
  setTeamAWinConfirmOpen: (open: boolean) => void;
  setTeamBWinConfirmOpen: (open: boolean) => void;
  handleTeamAWin: () => void;
  handleTeamBWin: () => void;
  teamAName: string;
  teamBName: string;
}

const ScoreboardConfirmDialogs: React.FC<ScoreboardConfirmDialogsProps> = ({
  teamAWinConfirmOpen,
  teamBWinConfirmOpen,
  setTeamAWinConfirmOpen,
  setTeamBWinConfirmOpen,
  handleTeamAWin,
  handleTeamBWin,
  teamAName,
  teamBName
}) => {
  return (
    <>
      <ConfirmDialog
        isOpen={teamAWinConfirmOpen}
        onClose={() => setTeamAWinConfirmOpen(false)}
        onConfirm={() => {
          handleTeamAWin();
          setTeamAWinConfirmOpen(false);
        }}
        title={`Declare ${teamAName} as Winner?`}
        description={`This will award a game win to ${teamAName}, reset ball counts, silently delete ALL unmatched bets (returning funds without recording any transactions), process all matched bets, completely clear the current betting queue, and move only matched next game bets to the current game. Are you sure?`}
        confirmText="Confirm Win"
        cancelText="Cancel"
      />
      
      <ConfirmDialog
        isOpen={teamBWinConfirmOpen}
        onClose={() => setTeamBWinConfirmOpen(false)}
        onConfirm={() => {
          handleTeamBWin();
          setTeamBWinConfirmOpen(false);
        }}
        title={`Declare ${teamBName} as Winner?`}
        description={`This will award a game win to ${teamBName}, reset ball counts, silently delete ALL unmatched bets (returning funds without recording any transactions), process all matched bets, completely clear the current betting queue, and move only matched next game bets to the current game. Are you sure?`}
        confirmText="Confirm Win"
        cancelText="Cancel"
      />
    </>
  );
};

export default ScoreboardConfirmDialogs;
