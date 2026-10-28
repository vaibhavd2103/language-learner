export type Correction = {
  isCorrect: boolean;
  corrected: string;
  explanation: string;
  mistakes: { original: string; fix: string; why: string }[];
};

export type Msg = {
  id: number;
  role: "user" | "assistant";
  text: string;
  correction?: Correction;
  translation?: string;
  revealed?: boolean;
  showEn?: boolean;
  busy?: "correcting" | "translating";
};

export type Status = "idle" | "listening" | "thinking" | "speaking";
