import { create } from "zustand";
import type { IBoardData, IBoardDetails } from "../types/boardData";

interface BoardStore {
  boards: IBoardData[];
  selectedBoard: IBoardDetails | null;

  setBoards: (boards: IBoardData[]) => void;

  setSelectedBoard: (board: IBoardDetails | null) => void;
}

export const useBoardStore = create<BoardStore>((set) => ({
  boards: [],
  selectedBoard: null,

  setBoards: (boards) => set({ boards }),
  setSelectedBoard: (selectedBoard) => set({ selectedBoard }),
}));
