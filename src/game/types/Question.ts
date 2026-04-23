export interface QuestionOption {
  id: string;
  texto: string;
}

export interface Question {
  id: number;
  introTexto?: string;
  texto: string;
  opcoes: QuestionOption[];
  correta: string;
}
